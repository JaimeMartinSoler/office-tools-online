import { describe as group, expect, it } from "vitest";
import {
  DEFAULT_OPTIONS,
  estimateStrength,
  generatePassword,
  MAX_LENGTH,
  MIN_LENGTH,
  poolFor,
  validate,
  type PasswordOptions,
  type RandomSource,
} from "./logic";

function opts(partial: Partial<PasswordOptions> = {}): PasswordOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...partial,
    sets: { ...DEFAULT_OPTIONS.sets, ...partial.sets },
    min: { ...DEFAULT_OPTIONS.min, ...partial.min },
  };
}

/** Deterministic source that always returns 0 — picks the first pool char. */
const zero: RandomSource = () => 0;

/** Cycling source, useful to spread picks across a pool. */
function cycling(): RandomSource {
  let n = 0;
  return (max) => n++ % max;
}

const count = (s: string, set: string) =>
  s.split("").filter((c) => set.includes(c)).length;

group("validate", () => {
  it("accepts the defaults", () => {
    expect(validate(DEFAULT_OPTIONS).ok).toBe(true);
  });

  it("rejects when no set is selected", () => {
    const r = validate(
      opts({ sets: { lower: false, upper: false, digit: false, special: false } }),
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/at least one character set/i);
  });

  it("rejects length below the minimum", () => {
    const r = validate(opts({ length: MIN_LENGTH - 1 }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/between/i);
  });

  it("rejects length above the maximum", () => {
    expect(validate(opts({ length: MAX_LENGTH + 1 })).ok).toBe(false);
  });

  it("rejects minimums that exceed the length", () => {
    const r = validate(
      opts({ length: 4, min: { lower: 2, upper: 2, digit: 2, special: 2 } }),
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/exceeds the length/i);
  });

  it("ignores minimums of disabled sets", () => {
    const r = validate(
      opts({
        length: 4,
        sets: { lower: true, upper: false, digit: false, special: false },
        min: { lower: 1, upper: 50, digit: 50, special: 50 },
      }),
    );
    expect(r.ok).toBe(true);
  });
});

group("generatePassword", () => {
  it("produces a password of the requested length", () => {
    const r = generatePassword(opts({ length: 24 }), cycling());
    expect(r.ok && r.value.length).toBe(24);
  });

  it("propagates validation errors", () => {
    const r = generatePassword(
      opts({ sets: { lower: false, upper: false, digit: false, special: false } }),
    );
    expect(r.ok).toBe(false);
  });

  it("only uses characters from enabled sets", () => {
    const r = generatePassword(
      opts({
        length: 40,
        sets: { lower: true, upper: false, digit: true, special: false },
      }),
      cycling(),
    );
    const allowed = poolFor("lower", false) + poolFor("digit", false);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.split("").every((c) => allowed.includes(c))).toBe(true);
    }
  });

  it("honors per-set minimums", () => {
    const r = generatePassword(
      opts({ length: 20, min: { lower: 3, upper: 2, digit: 4, special: 1 } }),
      cycling(),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(count(r.value, poolFor("lower", false))).toBeGreaterThanOrEqual(3);
      expect(count(r.value, poolFor("upper", false))).toBeGreaterThanOrEqual(2);
      expect(count(r.value, poolFor("digit", false))).toBeGreaterThanOrEqual(4);
      expect(count(r.value, poolFor("special", false))).toBeGreaterThanOrEqual(1);
    }
  });

  it("excludes ambiguous characters when requested", () => {
    const r = generatePassword(
      opts({ length: 60, excludeAmbiguous: true }),
      cycling(),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(/[Il1O0o]/.test(r.value)).toBe(false);
    }
  });

  it("is deterministic given a fixed random source", () => {
    const a = generatePassword(opts({ length: 12 }), zero);
    const b = generatePassword(opts({ length: 12 }), zero);
    expect(a.ok && b.ok && a.value).toBe(b.ok ? b.value : "");
  });
});

group("estimateStrength", () => {
  it("grows with length", () => {
    const short = estimateStrength(opts({ length: 6 })).bits;
    const long = estimateStrength(opts({ length: 32 })).bits;
    expect(long).toBeGreaterThan(short);
  });

  it("labels a long all-sets password as Excellent", () => {
    const s = estimateStrength(opts({ length: 20 }));
    expect(s.label).toBe("Excellent");
    expect(s.score).toBe(3);
  });

  it("labels a short single-set password as Weak", () => {
    const s = estimateStrength(
      opts({
        length: 6,
        sets: { lower: true, upper: false, digit: false, special: false },
      }),
    );
    expect(s.label).toBe("Weak");
    expect(s.score).toBe(0);
  });
});
