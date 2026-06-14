import { err, ok, type Result } from "@/lib/result";

export type CharSet = "lower" | "upper" | "digit" | "special";

export const CHAR_SETS: CharSet[] = ["lower", "upper", "digit", "special"];

export interface PasswordOptions {
  length: number;
  /** Which character sets are enabled. */
  sets: Record<CharSet, boolean>;
  /** Minimum count per set; only applied when the set is enabled. */
  min: Record<CharSet, number>;
  /** Drop look-alike characters (I l 1 O 0 o etc.). */
  excludeAmbiguous: boolean;
}

export const MIN_LENGTH = 4;
export const MAX_LENGTH = 128;

export const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  sets: { lower: true, upper: true, digit: true, special: true },
  min: { lower: 1, upper: 1, digit: 1, special: 1 },
  excludeAmbiguous: false,
};

/** Base pools per set. */
const POOLS: Record<CharSet, string> = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digit: "0123456789",
  // A broadly-accepted set of symbols that most password policies allow.
  special: "!@#$%^&*()-_=+[]{};:,.?/",
};

/** Easily confused characters, removed when `excludeAmbiguous` is on. */
const AMBIGUOUS = new Set("Il1O0o".split(""));

/** Human-friendly label per set, used by the UI. */
export const SET_LABELS: Record<CharSet, string> = {
  lower: "Lowercase",
  upper: "Uppercase",
  digit: "Digits",
  special: "Special",
};

/** The usable pool for a set after applying `excludeAmbiguous`. */
export function poolFor(set: CharSet, excludeAmbiguous: boolean): string {
  const base = POOLS[set];
  if (!excludeAmbiguous) return base;
  return base
    .split("")
    .filter((c) => !AMBIGUOUS.has(c))
    .join("");
}

/** Sets that are both enabled and still have a non-empty pool. */
function activeSets(options: PasswordOptions): CharSet[] {
  return CHAR_SETS.filter(
    (set) => options.sets[set] && poolFor(set, options.excludeAmbiguous).length > 0,
  );
}

export type RandomSource = (max: number) => number; // uniform int in [0, max)

/**
 * Cryptographically secure uniform integer in [0, max) using
 * crypto.getRandomValues with rejection sampling to avoid modulo bias.
 */
export function cryptoRandom(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0]!;
  } while (value >= limit);
  return value % max;
}

function pick(pool: string, rand: RandomSource): string {
  return pool[rand(pool.length)]!;
}

/** Validate options, returning a user-facing error message on failure. */
export function validate(options: PasswordOptions): Result<true> {
  if (!Number.isInteger(options.length)) {
    return err("Length must be a whole number.");
  }
  if (options.length < MIN_LENGTH || options.length > MAX_LENGTH) {
    return err(`Length must be between ${MIN_LENGTH} and ${MAX_LENGTH}.`);
  }
  const active = activeSets(options);
  if (active.length === 0) {
    return err("Select at least one character set.");
  }
  let minTotal = 0;
  for (const set of active) {
    const m = options.min[set];
    if (!Number.isInteger(m) || m < 0) {
      return err(`${SET_LABELS[set]} minimum must be zero or a positive number.`);
    }
    minTotal += m;
  }
  if (minTotal > options.length) {
    return err(
      `Minimums add up to ${minTotal}, which exceeds the length of ${options.length}.`,
    );
  }
  return ok(true);
}

/**
 * Generate a password. Pure given `rand` (defaults to a CSPRNG), so tests can
 * inject a deterministic source. Returns the same errors as `validate`.
 */
export function generatePassword(
  options: PasswordOptions,
  rand: RandomSource = cryptoRandom,
): Result<string> {
  const valid = validate(options);
  if (!valid.ok) return valid;

  const active = activeSets(options);
  const chars: string[] = [];

  // 1. Satisfy the per-set minimums first.
  for (const set of active) {
    const pool = poolFor(set, options.excludeAmbiguous);
    for (let i = 0; i < options.min[set]; i++) {
      chars.push(pick(pool, rand));
    }
  }

  // 2. Fill the remainder from the combined pool of all active sets.
  const combined = active
    .map((set) => poolFor(set, options.excludeAmbiguous))
    .join("");
  while (chars.length < options.length) {
    chars.push(pick(combined, rand));
  }

  // 3. Fisher–Yates shuffle so the guaranteed minimums aren't front-loaded.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    const tmp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }

  return ok(chars.join(""));
}

export type StrengthLabel = "Weak" | "Fair" | "Strong" | "Excellent";

export interface Strength {
  /** Estimated entropy in bits. */
  bits: number;
  label: StrengthLabel;
  /** 0–3, for coloring a strength meter. */
  score: 0 | 1 | 2 | 3;
}

/**
 * Estimate entropy as length × log2(poolSize) over the combined active pool.
 * Returns zero bits when no set is selected (an invalid configuration).
 */
export function estimateStrength(options: PasswordOptions): Strength {
  const active = activeSets(options);
  const poolSize = active.reduce(
    (sum, set) => sum + poolFor(set, options.excludeAmbiguous).length,
    0,
  );
  const bits =
    poolSize <= 1 ? 0 : Math.round(options.length * Math.log2(poolSize));

  let score: 0 | 1 | 2 | 3;
  let label: StrengthLabel;
  if (bits < 40) {
    score = 0;
    label = "Weak";
  } else if (bits < 60) {
    score = 1;
    label = "Fair";
  } else if (bits < 80) {
    score = 2;
    label = "Strong";
  } else {
    score = 3;
    label = "Excellent";
  }
  return { bits, label, score };
}
