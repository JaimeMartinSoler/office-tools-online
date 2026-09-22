import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Converts a color written as HEX (3, 4, 6 or 8 digits), `rgb()`, `hsl()` or `oklch()` into all four notations at once, including alpha. It accepts both the legacy comma syntax and the modern space syntax with `/ alpha`. The contrast checker computes the WCAG 2.1 contrast ratio between a text color and a background color and grades it against the AA and AAA thresholds for normal and large text.",
  steps: [
    "Type a color value, or pick one with the color swatch.",
    "Copy the **Hex**, **RGB**, **HSL** or **OKLCH** form you need.",
    "Under **Contrast checker**, set a background color to test your color against.",
    "Read the ratio and the four pass/fail grades.",
  ],
  examples: [
    {
      title: "A HEX color in every notation",
      note: "Output uses the modern space-separated CSS syntax.",
      input: "#3b82f6",
      output: "Hex    #3b82f6\nRGB    rgb(59 130 246)\nHSL    hsl(217.2 91.2% 59.8%)\nOKLCH  oklch(0.6231 0.188 259.81)",
    },
    {
      title: "Legacy comma syntax in, modern syntax out",
      input: "rgb(255, 165, 0)",
      output: "Hex    #ffa500\nRGB    rgb(255 165 0)\nHSL    hsl(38.8 100% 50%)\nOKLCH  oklch(0.7927 0.171 70.67)",
    },
    {
      title: "A semi-transparent color",
      note: "Alpha 0.5 becomes `80` in 8-digit HEX (0.5 × 255, rounded).",
      input: "hsl(0 100% 50% / 0.5)",
      output: "Hex    #ff000080\nRGB    rgb(255 0 0 / 0.5)\nHSL    hsl(0 100% 50% / 0.5)\nOKLCH  oklch(0.628 0.2577 29.23 / 0.5)",
    },
    {
      title: "The lightest gray that passes AA on white",
      note: "Contrast checker. One step lighter, `#777777`, scores 4.48 and fails AA for normal text.",
      input: "Text #767676 on background #ffffff",
      output: "4.54 : 1\nPass · AA (normal)\nFail · AAA (normal)\nPass · AA (large)\nPass · AAA (large)",
      outputLabel: "Contrast",
    },
  ],
  faq: [
    {
      question: "What contrast ratio do I need?",
      answer:
        "WCAG 2.1 level AA requires 4.5:1 for normal text and 3:1 for large text (at least 24px, or 18.66px bold). Level AAA raises those to 7:1 and 4.5:1. The ratio runs from 1:1 (identical colors) to 21:1 (black on white). Tailwind's `blue-500`, `#3b82f6`, scores only 3.68:1 on white, so it passes AA for large text only.",
    },
    {
      question: "Why use OKLCH instead of HSL?",
      answer:
        "HSL lightness isn't perceptual: `hsl(60 100% 50%)` (yellow) and `hsl(240 100% 50%)` (blue) have the same L but look very different in brightness. OKLCH's L tracks perceived lightness, so changing only the hue keeps colors visually balanced, which makes it better for palettes and accessible themes. All current browsers support `oklch()` in CSS.",
    },
    {
      question: "What happens to OKLCH colors outside the sRGB gamut?",
      answer:
        "OKLCH can describe colors that sRGB screens and HEX values can't represent. When you enter one, each channel is clamped to 0–255 to produce the HEX, RGB and HSL values, so the conversion back to OKLCH shows the nearest displayable color, not your original numbers. That difference tells you the color was out of gamut.",
    },
    {
      question: "Does the contrast check account for transparency?",
      answer:
        "No. The ratio uses only the red, green and blue channels and ignores alpha, as the WCAG formula assumes opaque colors. For semi-transparent text, first work out the color it actually shows on its background, then check that solid color.",
    },
    {
      question: "Can I type color names like \"red\" or \"rebeccapurple\"?",
      answer:
        "Not currently. The parser accepts `#hex`, `rgb()`/`rgba()`, `hsl()`/`hsla()` and `oklch()`, and returns an error for anything else. For a named color, look up its HEX value (red is `#ff0000`) and paste that.",
    },
  ],
  related:
    "Hex colors are just base-16 numbers: the [Number Base Converter](/tools/number-base-converter/) shows `0xFF` as 255, the maximum of each RGB channel. For the rest of a design-token file, the [JSON Formatter & Converter](/tools/json-yaml-xml/) switches between JSON and YAML.",
};
