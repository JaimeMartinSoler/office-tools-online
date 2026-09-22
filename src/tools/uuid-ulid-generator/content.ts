import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Generates up to 1,000 identifiers at once in three formats: random UUID v4 (RFC 4122), time-ordered UUID v7 (RFC 9562), and ULID, a 26-character Crockford Base32 ID. UUIDs can be written in lowercase or uppercase and optionally wrapped in braces for C# or registry-style GUID literals. All randomness comes from the Web Crypto API, and v7 UUIDs and ULIDs embed the current time in milliseconds.",
  steps: [
    "Choose **UUID v4**, **UUID v7** or **ULID**.",
    "Set **Count** (1–1,000), then choose **lower** or **UPPER** case and, for UUIDs, braces.",
    "Copy the whole list — one ID per line — or click **Regenerate** for a fresh batch.",
  ],
  examples: [
    {
      title: "Three random UUID v4s",
      note: "The `4` at the start of the third group is the version. The next group always starts with `8`, `9`, `a` or `b` (the RFC variant). The rest is random, so your output will differ.",
      input: "UUID v4 · Count 3 · lower",
      output:
        "16d3b23d-4896-43f8-a3ed-16a8152856d8\n1c1e9f1b-0f73-46d8-98f0-cf6a53012cf0\nefacffda-651f-4366-b64d-9febf3670dfe",
    },
    {
      title: "UUID v7s generated at 2024-06-14 00:00:00 UTC",
      note: "The first 12 hex digits, `0190140b-4000`, are the Unix time in milliseconds (1718323200000). IDs made later sort after these.",
      input: "UUID v7 · Count 3 · lower",
      output:
        "0190140b-4000-7a54-b23d-1c57da397245\n0190140b-4000-7161-894d-bbebb35605fd\n0190140b-4000-7223-9efa-de9a2bf87dd5",
    },
    {
      title: "GUID literals for C#",
      note: "UUID v7 · UPPER · braces on.",
      input: "UUID v7 · Count 2 · UPPER · braces",
      output: "{0190140B-4000-7159-B19A-B674AC576A31}\n{0190140B-4000-7E92-B8B1-45DF7613F889}",
    },
    {
      title: "ULIDs from the same millisecond",
      note: "The first 10 characters, `01J0A0PG00`, encode the timestamp. The last 16 are 80 random bits.",
      input: "ULID · Count 3 · UPPER",
      output: "01J0A0PG00B8KJPYCXEB24T22P\n01J0A0PG00JZDAJ7WVQVMS9HPY\n01J0A0PG00YGZ9JBCER0W0CA1T",
    },
  ],
  faq: [
    {
      question: "Should I use UUID v4 or UUID v7?",
      answer:
        "Use v7 for database primary keys. Because it starts with a timestamp, new rows land at the end of a B-tree index instead of at random positions, which keeps inserts fast and indexes compact. Use v4 when the ID must not reveal when it was created, for example in public URLs.",
    },
    {
      question: "What is the difference between a ULID and a UUID v7?",
      answer:
        "Both put a 48-bit millisecond timestamp first, followed by randomness, so both sort by creation time. A ULID is written as 26 Crockford Base32 characters with no hyphens, and it avoids `I`, `L`, `O` and `U` to prevent misreading. A UUID v7 is 36 hex characters and fits in any column or API that already expects a UUID.",
    },
    {
      question: "Can two generated IDs collide?",
      answer:
        "In practice, no. A v4 UUID has 122 random bits: you would need about 2.7 × 10^18 of them for a 50% chance of a single collision. A ULID has 80 random bits per millisecond, and a v7 UUID has 74. Collisions come from broken random number generators, not from the formats, and this tool uses the browser's cryptographic one.",
    },
    {
      question: "Are IDs in one batch in sorted order?",
      answer:
        "Not necessarily. A batch is generated within the same millisecond, so every v7 UUID or ULID in it shares the same timestamp prefix, and the random part decides the order within the batch (see the examples above). IDs from later batches always sort after earlier ones. If you need a strict sequence inside one millisecond, use a monotonic ULID library in your application.",
    },
    {
      question: "Why are my ULIDs in lowercase?",
      answer:
        "The letter-case toggle applies to ULIDs too, and it starts on **lower**. The canonical ULID form is uppercase, so switch to **UPPER** to match most libraries. ULID decoders are case-insensitive, so both forms parse to the same value. Braces only apply to UUIDs.",
    },
  ],
  related:
    "A UUID v7's first 12 hex digits are a millisecond timestamp. Converting that hex number with the [Number Base Converter](/tools/number-base-converter/) and pasting the result into the [Unix Timestamp Converter](/tools/unix-timestamp/) shows when the ID was made. For secrets rather than identifiers, use the [Password Generator](/tools/password-generator/).",
};
