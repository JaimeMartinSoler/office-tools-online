import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Percent-encodes text for use in a URL and decodes it again, using the browser's own `encodeURIComponent` / `encodeURI` rules and their decoding counterparts. **Component** mode escapes everything except letters, digits and `-_.!~*'()`, which is what a single query value or path segment needs. **Full URL** mode leaves the URL's structure (`:/?#&=`) intact. A third mode, **Parse query**, splits a URL or bare query string into decoded key/value pairs.",
  steps: [
    "Choose **Encode**, **Decode**, or **Parse query**.",
    "For Encode and Decode, choose **Component** for a single value or **Full URL** for a complete address.",
    "Paste your text or URL into the input pane.",
    "Copy the result. In Parse query mode, the copy button gives tab-separated `key` / `value` lines that paste straight into a spreadsheet.",
  ],
  examples: [
    {
      title: "Encode a value for a query string",
      note: "Encode · Component. Spaces become `%20`, and `&` and `?` are escaped so they can't split the query.",
      input: "Ada Lovelace & co?",
      output: "Ada%20Lovelace%20%26%20co%3F",
    },
    {
      title: "Encode a whole URL without breaking it",
      note: "Encode · Full URL. Only the space and the `é` are escaped; `://`, `?`, `=` and `&` keep their meaning.",
      input: "https://example.com/a path/?q=café&x=1",
      output: "https://example.com/a%20path/?q=caf%C3%A9&x=1",
    },
    {
      title: "Decode UTF-8 percent-escapes",
      note: "Decode · Component. Multi-byte sequences such as `%F0%9F%98%80` decode back to the original character.",
      input: "caf%C3%A9%20%F0%9F%98%80",
      output: "café 😀",
    },
    {
      title: "Parse a query string with repeated keys",
      note: "Parse query. `+` is read as a space, `%25` as `%`, and repeated keys are kept in order.",
      input: "https://shop.example.com/search?q=red+shoes&size=42&size=43&note=50%25%20off#top",
      output: "q     red shoes\nsize  42\nsize  43\nnote  50% off",
      outputLabel: "Parameters",
    },
  ],
  faq: [
    {
      question: "Should I use Component or Full URL mode?",
      answer:
        "Use **Component** for anything that goes inside a URL: a query value, a path segment, or a URL passed as a parameter to another URL. Use **Full URL** only to clean up a complete address that contains spaces or non-ASCII characters. Full URL mode deliberately leaves `&`, `=` and `?` alone, so it cannot protect a value that contains them.",
    },
    {
      question: "Why is a space sometimes %20 and sometimes +?",
      answer:
        "`%20` is the percent-encoding of a space and is valid anywhere in a URL. `+` means a space only inside HTML form-style query strings (`application/x-www-form-urlencoded`). The encoder always writes `%20`. Parse query mode follows form rules and reads `+` as a space, but Decode mode leaves a `+` as it is.",
    },
    {
      question: "What does \"Invalid percent-encoding\" mean?",
      answer:
        "A `%` must be followed by two hex digits, and together the bytes must form valid UTF-8. Input like `100%` or a sequence cut off halfway, such as `%E2%82`, can't be decoded, so the tool reports an error instead of guessing. If the `%` is meant literally, encode it as `%25`.",
    },
    {
      question: "Does Parse query need a full URL?",
      answer:
        "No. It accepts a full URL (and also shows the protocol, host, path and fragment), a query string with or without the leading `?`, or a relative link such as `/page?a=1`. Anything after a `#` is treated as the fragment, not as parameters. Keys and values are shown decoded.",
    },
    {
      question: "Is percent-encoding a way to hide data?",
      answer:
        "No. It is a reversible escaping scheme that anyone can decode, just like Base64. Tokens and personal data in a URL still appear in server logs, browser history and `Referer` headers, whether they are encoded or not.",
    },
  ],
  related:
    "Base64 values often end up in URLs. The [Base64 tool](/tools/base64/) has a URL-safe mode that avoids `+` and `/` in the first place. Bearer tokens in query strings are usually JWTs, which the [JWT Inspector](/tools/jwt-inspector/) decodes.",
};
