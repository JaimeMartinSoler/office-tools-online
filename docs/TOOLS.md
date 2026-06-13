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
- Bidirectional conversion between JSON, YAML, and XML (absorbs the former
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

## clipboard-sharing  [PLACEHOLDER — v1 does nothing]
- Render the tool page + "Coming soon" empty state. No backend, no logic.
- Keep it in the registry so the menu/route exist, but wire no functionality.
