import { err, ok, type Result } from "@/lib/result";

/** A colour in 8-bit sRGB plus an alpha channel in [0, 1]. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

const round = (n: number, dp: number) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseHex(input: string): Result<Rgb> {
  const hex = input.slice(1);
  const expand = (s: string) =>
    s
      .split("")
      .map((c) => c + c)
      .join("");
  let normalized: string;
  if (hex.length === 3 || hex.length === 4) normalized = expand(hex);
  else if (hex.length === 6 || hex.length === 8) normalized = hex;
  else return err("Hex colours must have 3, 4, 6, or 8 digits.");

  if (!/^[0-9a-fA-F]+$/.test(normalized)) {
    return err("Hex colours may only contain 0–9 and a–f.");
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const a =
    normalized.length === 8 ? parseInt(normalized.slice(6, 8), 16) / 255 : 1;
  return ok({ r, g, b, a });
}

/** Read the comma/space-separated arguments out of a `name(...)` function. */
function fnArgs(input: string, name: string): string[] | null {
  const match = input.match(new RegExp(`^${name}a?\\(([^)]*)\\)$`, "i"));
  if (!match) return null;
  return match[1]!
    .replace(/\//g, " ") // modern slash-alpha syntax
    .split(/[\s,]+/)
    .filter((s) => s !== "");
}

/** Parse a number that may carry a trailing `%`, scaled by `scale` when so. */
function num(token: string, scale = 1): number | null {
  if (token === "none") return 0;
  const pct = token.endsWith("%");
  const value = parseFloat(pct ? token.slice(0, -1) : token);
  if (Number.isNaN(value)) return null;
  return pct ? (value / 100) * scale : value;
}

function parseRgbFn(input: string): Result<Rgb> | null {
  const args = fnArgs(input, "rgb");
  if (!args || args.length < 3) return null;
  const r = num(args[0]!, 255);
  const g = num(args[1]!, 255);
  const b = num(args[2]!, 255);
  const a = args[3] !== undefined ? num(args[3]!, 1) : 1;
  if (r === null || g === null || b === null || a === null) {
    return err("Could not parse the rgb() values.");
  }
  return ok({
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255),
    a: clamp(a, 0, 1),
  });
}

function parseHslFn(input: string): Result<Rgb> | null {
  const args = fnArgs(input, "hsl");
  if (!args || args.length < 3) return null;
  const h = num(args[0]!, 360);
  const s = num(args[1]!, 100);
  const l = num(args[2]!, 100);
  const a = args[3] !== undefined ? num(args[3]!, 1) : 1;
  if (h === null || s === null || l === null || a === null) {
    return err("Could not parse the hsl() values.");
  }
  return ok({ ...hslToRgb(h, s, l), a: clamp(a, 0, 1) });
}

function parseOklchFn(input: string): Result<Rgb> | null {
  const args = fnArgs(input, "oklch");
  if (!args || args.length < 3) return null;
  // L accepts 0–1 or a percentage; C is unbounded; H is in degrees.
  const l = num(args[0]!, 1);
  const c = num(args[1]!, 0.4);
  const h = num(args[2]!, 360);
  const a = args[3] !== undefined ? num(args[3]!, 1) : 1;
  if (l === null || c === null || h === null || a === null) {
    return err("Could not parse the oklch() values.");
  }
  return ok({ ...oklchToRgb(l, c, h), a: clamp(a, 0, 1) });
}

/** Parse any supported colour string (hex, rgb, hsl, oklch). */
export function parseColor(input: string): Result<Rgb> {
  const trimmed = input.trim();
  if (trimmed === "") return err("Enter a colour to convert.");

  if (trimmed.startsWith("#")) return parseHex(trimmed);

  const lower = trimmed.toLowerCase();
  for (const parser of [parseRgbFn, parseHslFn, parseOklchFn]) {
    const result = parser(lower);
    if (result) return result;
  }
  return err(
    "Unrecognised colour. Try #hex, rgb(…), hsl(…), or oklch(…).",
  );
}

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

export function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 100) / 100;
  const ll = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
}

const srgbToLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const linearToSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/** sRGB (0–255) → OKLCH, per Björn Ottosson's reference matrices. */
export function rgbToOklch(
  r: number,
  g: number,
  b: number,
): { l: number; c: number; h: number } {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: round(L, 4), c: round(C, 4), h: round(C < 1e-4 ? 0 : H, 2) };
}

/** OKLCH → sRGB (0–255), clamped into gamut. */
export function oklchToRgb(
  L: number,
  C: number,
  H: number,
): { r: number; g: number; b: number } {
  const hRad = (H * Math.PI) / 180;
  const A = C * Math.cos(hRad);
  const B = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: clamp(Math.round(linearToSrgb(lr) * 255), 0, 255),
    g: clamp(Math.round(linearToSrgb(lg) * 255), 0, 255),
    b: clamp(Math.round(linearToSrgb(lb) * 255), 0, 255),
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

export interface ColorFormats {
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
}

export function formatColor(c: Rgb): ColorFormats {
  const hasAlpha = c.a < 1;
  const hex = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${
    hasAlpha ? hex2(c.a * 255) : ""
  }`;
  const rgb = hasAlpha
    ? `rgb(${c.r} ${c.g} ${c.b} / ${round(c.a, 2)})`
    : `rgb(${c.r} ${c.g} ${c.b})`;
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b);
  const hsl = hasAlpha
    ? `hsl(${h} ${s}% ${l}% / ${round(c.a, 2)})`
    : `hsl(${h} ${s}% ${l}%)`;
  const ok = rgbToOklch(c.r, c.g, c.b);
  const oklch = hasAlpha
    ? `oklch(${ok.l} ${ok.c} ${ok.h} / ${round(c.a, 2)})`
    : `oklch(${ok.l} ${ok.c} ${ok.h})`;
  return { hex, rgb, hsl, oklch };
}

// ---------------------------------------------------------------------------
// Contrast (WCAG 2.1)
// ---------------------------------------------------------------------------

/** Relative luminance per WCAG, ignoring alpha. */
export function relativeLuminance(c: Rgb): number {
  const lr = srgbToLinear(c.r / 255);
  const lg = srgbToLinear(c.g / 255);
  const lb = srgbToLinear(c.b / 255);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return round((lighter + 0.05) / (darker + 0.05), 2);
}

export interface ContrastVerdict {
  ratio: number;
  aaNormal: boolean;
  aaaNormal: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
}

export function gradeContrast(a: Rgb, b: Rgb): ContrastVerdict {
  const ratio = contrastRatio(a, b);
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaaNormal: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  };
}
