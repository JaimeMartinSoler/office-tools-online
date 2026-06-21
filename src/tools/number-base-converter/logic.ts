import { err, ok, type Result } from "@/lib/result";

export type Base = "bin" | "oct" | "dec" | "hex";

export const BASES: Base[] = ["bin", "oct", "dec", "hex"];

export const BASE_RADIX: Record<Base, number> = {
  bin: 2,
  oct: 8,
  dec: 10,
  hex: 16,
};

export const BASE_LABELS: Record<Base, string> = {
  bin: "Binary",
  oct: "Octal",
  dec: "Decimal",
  hex: "Hexadecimal",
};

export const BASE_PREFIX: Record<Base, string> = {
  bin: "0b",
  oct: "0o",
  dec: "",
  hex: "0x",
};

/** Allowed digit characters per base (lowercase). */
const DIGITS: Record<Base, RegExp> = {
  bin: /^[01]+$/,
  oct: /^[0-7]+$/,
  dec: /^[0-9]+$/,
  hex: /^[0-9a-f]+$/,
};

/**
 * Detect the base from a `0b`/`0o`/`0x` prefix. Returns the base and the
 * remaining digits, or null when there is no recognised prefix.
 */
function detectPrefix(raw: string): { base: Base; digits: string } | null {
  const lower = raw.toLowerCase();
  if (lower.startsWith("0b")) return { base: "bin", digits: lower.slice(2) };
  if (lower.startsWith("0o")) return { base: "oct", digits: lower.slice(2) };
  if (lower.startsWith("0x")) return { base: "hex", digits: lower.slice(2) };
  return null;
}

/**
 * Parse an unsigned integer from `input`, interpreted in `base` (or, when
 * `base` is "auto", inferred from a `0b`/`0o`/`0x` prefix and otherwise decimal).
 * Underscores and surrounding whitespace are ignored. Returns a BigInt so
 * arbitrarily large values are exact.
 */
export function parseValue(input: string, base: Base | "auto"): Result<bigint> {
  let raw = input.trim().replace(/[_\s]/g, "");
  if (raw === "") return err("Enter a number to convert.");

  let negative = false;
  if (raw.startsWith("-")) {
    negative = true;
    raw = raw.slice(1);
  } else if (raw.startsWith("+")) {
    raw = raw.slice(1);
  }

  let effectiveBase: Base;
  let digits: string;
  if (base === "auto") {
    const detected = detectPrefix(raw);
    if (detected) {
      effectiveBase = detected.base;
      digits = detected.digits;
    } else {
      effectiveBase = "dec";
      digits = raw;
    }
  } else {
    // An explicit base still tolerates the matching prefix (e.g. "0xFF" in hex).
    const detected = detectPrefix(raw);
    digits = detected && detected.base === base ? detected.digits : raw;
    effectiveBase = base;
  }

  digits = digits.toLowerCase();
  if (digits === "") return err("Enter at least one digit.");
  if (!DIGITS[effectiveBase].test(digits)) {
    return err(
      `"${input.trim()}" is not a valid ${BASE_LABELS[effectiveBase].toLowerCase()} number.`,
    );
  }

  let value = 0n;
  const radix = BigInt(BASE_RADIX[effectiveBase]);
  for (const ch of digits) {
    value = value * radix + BigInt(parseInt(ch, 16));
  }
  return ok(negative ? -value : value);
}

/** Render a value in every base (no prefix), uppercased for hex. */
export function toAllBases(value: bigint): Record<Base, string> {
  const sign = value < 0n ? "-" : "";
  const abs = value < 0n ? -value : value;
  return {
    bin: sign + abs.toString(2),
    oct: sign + abs.toString(8),
    dec: sign + abs.toString(10),
    hex: sign + abs.toString(16).toUpperCase(),
  };
}

/**
 * Group the binary representation into bytes (8 bits), left-padded to a whole
 * number of bytes, for the bit-grid view. Negative numbers are shown by their
 * magnitude with a leading "-".
 */
export function toBitGroups(value: bigint): { sign: string; bytes: string[] } {
  const sign = value < 0n ? "-" : "";
  const abs = value < 0n ? -value : value;
  let bits = abs.toString(2);
  const pad = (8 - (bits.length % 8)) % 8;
  bits = "0".repeat(pad) + bits;
  const bytes: string[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(bits.slice(i, i + 8));
  }
  return { sign, bytes };
}

/** Number of significant bits needed to represent the magnitude. */
export function bitLength(value: bigint): number {
  const abs = value < 0n ? -value : value;
  return abs === 0n ? 0 : abs.toString(2).length;
}
