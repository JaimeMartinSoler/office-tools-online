import { describe, expect, it } from "vitest";
import {
  bitLength,
  parseValue,
  toAllBases,
  toBitGroups,
} from "./logic";

describe("parseValue", () => {
  it("parses each explicit base", () => {
    expect(parseValue("255", "dec")).toEqual({ ok: true, value: 255n });
    expect(parseValue("ff", "hex")).toEqual({ ok: true, value: 255n });
    expect(parseValue("11111111", "bin")).toEqual({ ok: true, value: 255n });
    expect(parseValue("377", "oct")).toEqual({ ok: true, value: 255n });
  });

  it("auto-detects from prefixes", () => {
    expect(parseValue("0xFF", "auto")).toEqual({ ok: true, value: 255n });
    expect(parseValue("0b1010", "auto")).toEqual({ ok: true, value: 10n });
    expect(parseValue("0o17", "auto")).toEqual({ ok: true, value: 15n });
    expect(parseValue("42", "auto")).toEqual({ ok: true, value: 42n });
  });

  it("tolerates a matching prefix, underscores, and whitespace", () => {
    expect(parseValue("0xFF", "hex")).toEqual({ ok: true, value: 255n });
    expect(parseValue("1111_1111", "bin")).toEqual({ ok: true, value: 255n });
    expect(parseValue("  10 ", "dec")).toEqual({ ok: true, value: 10n });
  });

  it("handles negative and arbitrarily large values exactly", () => {
    expect(parseValue("-10", "dec")).toEqual({ ok: true, value: -10n });
    const big = "123456789012345678901234567890";
    expect(parseValue(big, "dec")).toEqual({ ok: true, value: BigInt(big) });
  });

  it("rejects invalid digits and empty input", () => {
    expect(parseValue("2", "bin").ok).toBe(false);
    expect(parseValue("xyz", "hex").ok).toBe(false);
    expect(parseValue("   ", "dec").ok).toBe(false);
  });
});

describe("toAllBases", () => {
  it("renders every base, hex uppercased", () => {
    expect(toAllBases(255n)).toEqual({
      bin: "11111111",
      oct: "377",
      dec: "255",
      hex: "FF",
    });
  });

  it("keeps the sign", () => {
    expect(toAllBases(-15n).hex).toBe("-F");
  });
});

describe("toBitGroups", () => {
  it("pads to whole bytes and splits", () => {
    expect(toBitGroups(5n)).toEqual({ sign: "", bytes: ["00000101"] });
    expect(toBitGroups(256n)).toEqual({
      sign: "",
      bytes: ["00000001", "00000000"],
    });
  });

  it("represents zero as a single zero byte", () => {
    expect(toBitGroups(0n)).toEqual({ sign: "", bytes: ["00000000"] });
  });
});

describe("bitLength", () => {
  it("counts significant bits", () => {
    expect(bitLength(0n)).toBe(0);
    expect(bitLength(255n)).toBe(8);
    expect(bitLength(256n)).toBe(9);
  });
});
