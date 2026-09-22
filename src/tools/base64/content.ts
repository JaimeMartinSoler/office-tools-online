import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Converts text to Base64 and back, in either the standard alphabet (RFC 4648 §4, with `+`, `/` and `=` padding) or the URL-safe Base64URL alphabet (§5, with `-` and `_` and no padding). Text is encoded as UTF-8 first, so accented letters, CJK and emoji survive the round trip. The Encode file button turns any file — an image, a PDF, a certificate — into a Base64 string without uploading it.",
  steps: [
    "Pick **Encode** to turn text into Base64, or **Decode** to turn Base64 back into text.",
    "Choose **Standard** for MIME, data URLs and most APIs, or **URL-safe** for tokens, query parameters and filenames.",
    "Type or paste into the left pane; the result updates as you type. To encode a binary file instead, click **Encode file**.",
    "Copy the result from the right pane.",
  ],
  examples: [
    {
      title: "Encode a sentence",
      note: "Encode · Standard. 13 bytes of input become 20 characters; the `==` pads the last 4-character group.",
      input: "Hello, world!",
      output: "SGVsbG8sIHdvcmxkIQ==",
    },
    {
      title: "Standard vs URL-safe for the same bytes",
      note: "The input `<<?>>` produces a `/` in standard Base64. URL-safe swaps it for `_` and drops the `=` padding.",
      input: "<<?>>",
      output: "Standard:  PDw/Pj4=\nURL-safe:  PDw_Pj4",
    },
    {
      title: "Non-ASCII text is encoded as UTF-8",
      note: "`é` takes two bytes and `☕` takes three, so 6 characters become 9 bytes and 12 Base64 characters.",
      input: "café ☕",
      output: "Y2Fmw6kg4piV",
    },
    {
      title: "Decode input that has lost its padding",
      note: "Decode · Standard. Missing `=` characters are restored before decoding, and whitespace and line breaks are ignored.",
      input: "SGk",
      output: "Hi",
    },
  ],
  faq: [
    {
      question: "What is Base64URL, and when should I use it?",
      answer:
        "Base64URL is Base64 with `-` and `_` in place of `+` and `/`, usually without `=` padding, so the result can sit in a URL, a cookie or a filename without further escaping. JWTs use it for all three segments. Use standard Base64 for email attachments, `data:` URLs and APIs that document plain Base64.",
    },
    {
      question: "Is the = padding required?",
      answer:
        "It depends on the decoder. Padding only makes the length a multiple of four, and it carries no data. This tool adds it back automatically when decoding, so `SGk` and `SGk=` both decode to `Hi`. Some strict decoders reject unpadded standard Base64, so leave padding on when you don't control the receiving side.",
    },
    {
      question: "Is Base64 encryption?",
      answer:
        "No. Base64 is a reversible encoding with no key: anyone can decode it, including this page. It exists to carry binary data through channels that only accept text. If you need to hide data, encrypt it first. If you need to detect tampering, use a signature or an HMAC — the [Hash Generator](/tools/hash-generator/) can compute HMACs.",
    },
    {
      question: "How are binary data and UTF-8 handled?",
      answer:
        "When you type text, it is converted to UTF-8 bytes before encoding, which is why non-ASCII characters work. When decoding, the bytes must form valid UTF-8 text, or the tool reports `Invalid Base64 input.` instead of showing garbled characters. To encode binary data, use **Encode file**, which reads the file's raw bytes.",
    },
    {
      question: "Is there a file size limit?",
      answer:
        "There is no fixed limit, because the file never leaves your browser: it is read into memory and encoded on your device. The practical limit is your device's memory. Base64 output is about a third larger than the input, and very large files (hundreds of megabytes) may make the editor sluggish.",
    },
  ],
  related:
    "A JWT is three Base64URL segments. To read one, paste the whole token into the [JWT Inspector](/tools/jwt-inspector/), which decodes the header and payload for you. If a Base64 value is going into a query string, standard Base64's `+` and `/` also need escaping, which the [URL Encoder](/tools/url/) handles.",
};
