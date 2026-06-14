# Tools — I/O contracts

Each tool exposes pure functions in logic.ts. Errors are returned, not thrown.

## Shared UX (all converter tools)
- One persistent status banner is always shown (never hidden), so the panes don't
  jump. Priority: error (red) > warning (amber) > info (grey, empty/waiting) >
  validated (green, "Looks good — valid <format>"). See `StatusBanner`.
- Every control carries an on-hover tooltip; context-dependent controls are
  disabled/grayed in the modes where they don't apply, rather than hidden.
- "Load sample" is mode-aware: it loads a beautified sample matching the currently
  selected direction/format.

## json-yaml-xml
- Bidirectional conversion between JSON, YAML, XML, and CSV (absorbs the former
  json-formatter). Input and output formats are each chosen via a segmented
  control under their pane label; same-format input is reformatted (so JSON→JSON
  is a formatter). Validation is implicit — parse errors surface with line info.
- Beautify/Minify: shown only when the OUTPUT is JSON or XML (the formats with a
  compact form); hidden for YAML. Minify produces single-line output and hides
  the indent control. Indent (2/4/tab) applies to JSON and XML (YAML falls back
  to 2 spaces for tab, since YAML forbids tab indentation).
- Load sample produces a beautified document in the chosen Input format.
- Orange notice: if a JSON object/array is placed in the YAML input, warn that
  every JSON is valid YAML (in case the wrong Input format was chosen).
- Uses `yaml` and `fast-xml-parser`. Surface parse errors per format.
- XML defaults: attributes preserved with the `@_` prefix (round-trips
  XML→JSON→XML); when a value has no single root key it is auto-wrapped in
  `<root>` to keep the output valid XML.
- CSV (in-house RFC-4180 parser/serializer) models an array of objects: first row
  is the header. Two CSV-only options (active only when CSV is input or output):
  "Nested CSV fields" flattens/expands dotted keys (`a.b`), and "Infer types"
  coerces cells to number/boolean/null instead of strings. Non-object rows or
  un-flattened nested fields surface a clear error.

## json-json-schema
- Bidirectional, chosen via a segmented "JSON → JSON Schema" / "JSON Schema → JSON"
  direction control (same pattern as base64 Encode/Decode).
- JSON → JSON Schema: infer a JSON Schema (draft 2020-12) from a sample document.
  Options: required-by-default toggle, infer-enums toggle (off by default).
- JSON Schema → JSON: generate a deterministic sample instance from a schema
  (in-house generator + mulberry32 seed; Regenerate advances the seed).
- Context-dependent option controls stay visible but are disabled/grayed in the
  other direction; every control carries an on-hover tooltip describing it.
- Load sample produces a beautified document matching the chosen direction
  (a JSON document when inferring, a JSON Schema when generating).
- JSON Schema → JSON surfaces a red error when the input is valid JSON but not a
  usable schema (no recognized schema keywords, or an unknown `type`).
- JSON → JSON Schema shows an orange notice when the input already looks like a
  JSON Schema (in case the wrong direction was chosen) — same pattern as the
  JSON-in-YAML notice. It warns, it doesn't block.

## markdown
- Converts a source document to Markdown, or previews Markdown. A top segmented
  control picks the Input format: HTML, CSV, or Markdown (each with an on-hover
  tooltip). Reuses `ConverterTool`.
- The output pane has a Raw / Formatted toggle (rendered as `outputControls`):
  Raw shows the Markdown source in the editor; Formatted renders it as a styled
  preview. Markdown input + Formatted = a live Markdown previewer.
- Formatted preview: `marked` (MD→HTML, GFM on) sanitised with `DOMPurify`,
  rendered in a `prose dark:prose-invert` container. It's lazy-loaded via a
  `ssr:false` dynamic component (`preview.tsx` / `preview-inner.tsx`), so marked
  + DOMPurify never run during prerender and only load on first use. The pure
  `markdownToHtml` lives in `logic.ts` (Node-testable); DOMPurify (needs the DOM)
  stays in the client component. External images/links in the preview won't load
  under the site CSP (`img-src 'self' data:`) — a privacy-preserving side effect.
- Markdown input is a passthrough (line endings normalised, trimmed); the Copy
  button always copies the raw Markdown, in either view.
- HTML → Markdown via `turndown` + `turndown-plugin-gfm` (ATX headings, fenced
  code, `-` bullets; GFM adds tables, strikethrough, task lists). turndown uses
  the browser's `DOMParser` in the client bundle (no network) and its bundled
  `@mixmark-io/domino` DOM in Node, so the logic stays pure and Node-testable
  with no `jsdom` dependency.
- CSV → Markdown table: in-house RFC-4180-ish parser (quoted fields, `""`
  escapes, embedded delimiters/newlines). First row is the header; `|` is escaped
  as `\|`, in-cell newlines become `<br>`, ragged rows are padded to the header
  width. Delimiter is auto-detected per first line among `,`, tab, `;`.
- Orange notice: if the input looks like the other format (HTML pasted while CSV
  is selected, or vice versa), warn to switch the Input format. It warns, it
  doesn't block.
- Load sample is mode-aware (a small HTML document or a few CSV rows).
- Out of scope (for now): PDF → Markdown. PDFs carry no semantic structure, so a
  client-side conversion would only be best-effort text extraction; deferred.

## string-case-converter
- Convert input to: lower, UPPER, camelCase, PascalCase, snake_case,
  kebab-case, CONSTANT_CASE, Title Case, Sentence case.
- Show all variants at once; per-line and whole-string modes.

## base64
- Encode/Decode (segmented toggle). Variants: standard base64 AND base64url,
  each with an on-hover tooltip explaining the RFC 4648 §4 vs §5 difference.
- Correct UTF-8 handling (TextEncoder/TextDecoder, not raw btoa/atob).
- Load sample is mode-aware: in Encode it loads plain text; in Decode it loads a
  Base64 string encoded with the selected variant (so it round-trips).
- Optional: file input → base64 (still fully local); a grey note reports the
  encoded file name/size above the status banner.
- Bespoke UI (not ConverterTool): renders its own `StatusBanner` (no warning
  state) — validated copy confirms the variant decoded / encoded.

## hash-generator
- Bespoke UI. Computes digests, HMACs, and slow KDF-derived keys entirely in the
  browser via `hash-wasm` (WASM, no network). The algorithm picker is grouped
  into "Digest / MAC" and "Key derivation (slow)".
- Digests: MD5, SHA-1, SHA-256/384/512, SHA3-256/512, RIPEMD-160, CRC32, plus
  variable-length BLAKE2b / BLAKE3 (with an optional native keyed mode). An
  output-encoding toggle switches Hex / Base64.
- HMAC toggle wraps any standard digest with a secret key (RFC 2104); requires a
  key, and is disabled/grayed for algorithms that don't support it.
- KDFs: PBKDF2 (iterations + PRF SHA1/256/512), scrypt (N/r/p), bcrypt (cost,
  16-byte salt), Argon2id (iterations, memory KiB, parallelism). KDFs are
  intentionally slow, so they run only on an explicit **Generate** button and any
  edit invalidates the result. bcrypt/Argon2id auto-generate a random salt when
  none is given (embedded in the encoded output) — so they're non-deterministic;
  PBKDF2/scrypt require an explicit salt.
- Async logic: `hash(options)` returns `Promise<Result<string>>`; a monotonic
  run-id guards against a slow result overwriting a newer one. Only the fields
  relevant to the selected algorithm (key, salt, length, cost params) are shown.

## url
- Bespoke UI. Three modes via a segmented control: Encode, Decode, Parse query.
- Encode/Decode carry an Encoding variant toggle — Component
  (`encodeURIComponent`/`decodeURIComponent`, escapes reserved chars) or Full URL
  (`encodeURI`/`decodeURI`, leaves URL structure intact). The variant is
  disabled/grayed in Parse mode.
- Parse query splits a full URL or query string into decoded key/value pairs,
  rendered as a `<table>`; for a full URL it also lists Protocol / Host / Path /
  Fragment. Copy flattens the params to tab-separated `key\tvalue` lines; an amber
  notice warns when there are no parameters.
- Pure functions return `Result`; all native (`URL` / `URLSearchParams`), no deps.

## password-generator
- Category: Encoding. Bespoke UI. Generates a password live (debounced) as
  options change, plus a Regenerate button. Uses the Web Crypto API
  (`crypto.getRandomValues`) with rejection sampling to avoid modulo bias — never
  `Math.random`.
- Character sets toggle as buttons: Lowercase, Uppercase, Digits, Special. A
  "No look-alikes" toggle drops easily-confused chars (I l 1 O 0 o). Length 4–128,
  with an optional per-set minimum count (guaranteed via a Fisher–Yates shuffle so
  the minimums aren't front-loaded).
- A strength meter shows estimated entropy (length × log2(poolSize)) bucketed
  Weak / Fair / Strong / Excellent. Validation errors (no set selected, minimums
  exceed length, out-of-range length) surface in the status banner.
- `generatePassword(options, rand?)` is pure given an injected random source (so
  tests are deterministic); it defaults to the in-app CSPRNG.

## unix-timestamp
- Category: Datetime. Bespoke UI. Converts a Unix timestamp ↔ a date, both
  directions via a Mode toggle (Timestamp → Date / Date → Timestamp).
- Unit toggle Auto / Seconds / Milliseconds (Auto guesses from magnitude: ~13
  digits → ms, ~10 → s). Unit is disabled/grayed in Date → Timestamp mode.
- Output is a labelled list of representations (ISO 8601, UTC, local, relative,
  epoch seconds/ms, …) each with a per-row copy button. A "Now" button loads the
  current time in the active mode. Pure functions return `Result`.

## cron-expression
- Explains a cron expression field by field. Category: **Datetime** (alongside
  unix-timestamp). Bespoke UI (not ConverterTool), modeled on unix-timestamp's
  layout and the url tool's `<table>` output.
- A Standard / Macros + Names segmented toggle picks the accepted syntax, and
  also drives a mode-aware Load Sample:
  - **Standard**: classic 5 numeric fields — `*`, ranges `a-b`, lists `a,b`,
    steps `*/n` and `a-b/n`.
  - **Macros + Names**: a superset that additionally accepts `@yearly`/
    `@annually`, `@monthly`, `@weekly`, `@daily`/`@midnight`, `@hourly` macros
    and `JAN`–`DEC` / `SUN`–`SAT` names. `@reboot` is reported as having no field
    schedule. Switching mode clears the input.
- Output is a 4-column table: **Field · Expression · Periodicity · Matches**
  (e.g. `*/15` → "Every 15 minutes" / `0, 15, 30, 45`). Day/month values display
  as names (Monday, January) even when the input is numeric; day-of-week 7 folds
  to Sunday (= 0). A full field shows e.g. `0–59 (all)`; long match lists are
  abbreviated. Copy yields tab-separated rows.
- In-house pure parser (`logic.ts`) returning `Result` — no date math (no "next
  run times"), no dependency, fully client-side. Errors name the offending field
  (out-of-range, reversed range, zero step, names/macros used in Standard mode).

## clipboard-sharing  [PLACEHOLDER — v1 does nothing]
- Render the tool page + "Coming soon" empty state. No backend, no logic.
- Keep it in the registry so the menu/route exist, but wire no functionality.
