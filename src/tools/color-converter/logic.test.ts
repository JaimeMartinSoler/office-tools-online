import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  formatColor,
  gradeContrast,
  hslToRgb,
  oklchToRgb,
  parseColor,
  rgbToHsl,
  rgbToOklch,
} from "./logic";

describe("parseColor", () => {
  it("parses hex in 3/6/8 digit forms", () => {
    expect(parseColor("#fff")).toEqual({ ok: true, value: { r: 255, g: 255, b: 255, a: 1 } });
    expect(parseColor("#ff0000")).toEqual({ ok: true, value: { r: 255, g: 0, b: 0, a: 1 } });
    const withAlpha = parseColor("#ff000080");
    expect(withAlpha.ok && withAlpha.value.r).toBe(255);
    expect(withAlpha.ok && Math.round(withAlpha.value.a * 100)).toBe(50);
  });

  it("parses rgb() with commas and modern syntax", () => {
    expect(parseColor("rgb(255, 0, 0)")).toEqual({ ok: true, value: { r: 255, g: 0, b: 0, a: 1 } });
    expect(parseColor("rgb(0 128 255)")).toEqual({ ok: true, value: { r: 0, g: 128, b: 255, a: 1 } });
  });

  it("parses hsl()", () => {
    const red = parseColor("hsl(0 100% 50%)");
    expect(red).toEqual({ ok: true, value: { r: 255, g: 0, b: 0, a: 1 } });
  });

  it("parses oklch() back to sRGB", () => {
    const red = parseColor("oklch(0.628 0.2577 29.23)");
    expect(red.ok && red.value.r).toBeGreaterThan(245);
    expect(red.ok && red.value.g).toBeLessThan(12);
    expect(red.ok && red.value.b).toBeLessThan(12);
  });

  it("rejects nonsense", () => {
    expect(parseColor("not-a-color").ok).toBe(false);
    expect(parseColor("#12345").ok).toBe(false);
  });
});

describe("hsl round-trip", () => {
  it("converts rgb→hsl→rgb consistently", () => {
    const hsl = rgbToHsl(0, 128, 255);
    const back = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(back).toEqual({ r: 0, g: 128, b: 255 });
  });
});

describe("oklch round-trip", () => {
  it("white is L≈1, C≈0", () => {
    const okl = rgbToOklch(255, 255, 255);
    expect(okl.l).toBeGreaterThan(0.99);
    expect(okl.c).toBeLessThan(0.001);
  });

  it("converts rgb→oklch→rgb within rounding", () => {
    const okl = rgbToOklch(64, 192, 100);
    const back = oklchToRgb(okl.l, okl.c, okl.h);
    expect(Math.abs(back.r - 64)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - 192)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - 100)).toBeLessThanOrEqual(1);
  });
});

describe("formatColor", () => {
  it("formats all four notations", () => {
    const f = formatColor({ r: 255, g: 0, b: 0, a: 1 });
    expect(f.hex).toBe("#ff0000");
    expect(f.rgb).toBe("rgb(255 0 0)");
    expect(f.hsl).toBe("hsl(0 100% 50%)");
    expect(f.oklch.startsWith("oklch(")).toBe(true);
  });

  it("includes alpha when below 1", () => {
    const f = formatColor({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(f.hex).toBe("#00000080");
    expect(f.rgb).toContain("/ 0.5");
  });
});

describe("contrast", () => {
  it("black on white is 21:1", () => {
    expect(
      contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 }),
    ).toBe(21);
  });

  it("grades WCAG levels", () => {
    const verdict = gradeContrast(
      { r: 0, g: 0, b: 0, a: 1 },
      { r: 255, g: 255, b: 255, a: 1 },
    );
    expect(verdict.aaNormal).toBe(true);
    expect(verdict.aaaNormal).toBe(true);

    const weak = gradeContrast(
      { r: 119, g: 119, b: 119, a: 1 },
      { r: 255, g: 255, b: 255, a: 1 },
    );
    expect(weak.aaaNormal).toBe(false);
  });
});
