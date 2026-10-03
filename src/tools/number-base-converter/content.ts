import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Converts a whole number between binary (base 2), octal (base 8), decimal (base 10) and hexadecimal (base 16), and draws its binary form as a grid of bytes with each bit position numbered. In **Auto** mode the input base comes from a `0b`, `0o` or `0x` prefix, and anything without a prefix is read as decimal. Numbers are handled as arbitrary-precision integers, so 64-bit values and larger convert exactly.",
  steps: [
    "Choose the input base, or leave it on **Auto** and type a prefix (`0x1F`, `0b1010`, `0o755`).",
    "Type the number. Underscores and spaces are ignored, so `1_000_000` and `0xDEAD_BEEF` are fine.",
    "Read all four bases in the **Conversions** table and copy the one you need, with its prefix.",
    "Use the **Bits** grid to see which bit positions are set.",
  ],
  examples: [
    {
      title: "A hex value in every base",
      note: "Auto mode · the `0x` prefix selects hexadecimal. 500 needs 9 significant bits, so the grid shows two bytes.",
      input: "0x1F4",
      output: "Binary       0b111110100\nOctal        0o764\nDecimal      500\nHexadecimal  0x1F4\n\nBits: 00000001 11110100",
    },
    {
      title: "Unix file permissions from octal",
      note: "Auto mode · `0o755` is rwxr-xr-x. In the bit grid, each octal digit is a group of three bits.",
      input: "0o755",
      output: "Binary       0b111101101\nOctal        0o755\nDecimal      493\nHexadecimal  0x1ED",
    },
    {
      title: "Larger than a 64-bit integer",
      note: "Input base Dec. 2^64 is one more than the largest unsigned 64-bit value and still converts exactly.",
      input: "18446744073709551616",
      output: "Binary       0b10000000000000000000000000000000000000000000000000000000000000000\nOctal        0o2000000000000000000000\nDecimal      18446744073709551616\nHexadecimal  0x10000000000000000",
    },
    {
      title: "A negative number",
      note: "Negative values are shown as a sign plus the magnitude, not in two's complement.",
      input: "-42",
      output: "Binary       -101010\nOctal        -52\nDecimal      -42\nHexadecimal  -2A",
    },
  ],
  faq: [
    {
      question: "Why is \"FF\" rejected in Auto mode?",
      answer:
        "Without a prefix, Auto mode reads the input as decimal, and `F` isn't a decimal digit. Either type `0xFF` or switch the input base to **Hex**. An explicit base also accepts its own prefix, so `0xFF` works in Hex mode too.",
    },
    {
      question: "How are negative numbers shown in binary?",
      answer:
        "As a minus sign and the binary magnitude: −42 is `-101010`, and the bit grid is labelled \"negative of\". The tool doesn't produce two's complement, because that depends on a fixed width (8, 16, 32 or 64 bits) you would have to choose. For an 8-bit two's complement value, subtract the magnitude from 256: −42 becomes 214, which is `0xD6`.",
    },
    {
      question: "Is there a size limit?",
      answer:
        "No fixed limit. Values are parsed as arbitrary-precision integers (BigInt), so the result is exact even well past 2^64, where many calculators start rounding. Only whole numbers are supported; a decimal point is rejected.",
    },
    {
      question: "Why is hexadecimal shown in uppercase?",
      answer:
        "Uppercase `A`–`F` is easier to tell apart from digits at a glance. Input is case-insensitive, so `0xff`, `0xFF` and `0Xff` all parse the same way. If you need lowercase output, the copied value is just text you can lowercase.",
    },
  ],
  related:
    "To encode text or bytes rather than numbers, use [Base64](/tools/base64/). Hex digests from the [Hash Generator](/tools/hash-generator/) are really very large numbers, and so is a UUID from the [UUID & ULID Generator](/tools/uuid-ulid-generator/) once its hyphens are removed — both convert here if you want the decimal value.",
};
