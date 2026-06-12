# Tools — I/O contracts

Each tool exposes pure functions in logic.ts. Errors are returned, not thrown.

## json-formatter
- Beautify (configurable indent 2/4/tab), Minify, Validate.
- Input: JSON string. Output: formatted string or parse error w/ line/col.

## json-to-yaml  /  yaml-to-json
- Lossless where possible. Uses `yaml`. Surface YAML/JSON parse errors.

## json-to-json-schema
- Infer JSON Schema (draft 2020-12) from a sample JSON document.
- Options: required-by-default toggle, infer enums off by default.

## json-schema-to-json
- Generate a sample/mock JSON instance from a JSON Schema (`json-schema-faker`).
- Deterministic seed option for reproducible output.

## string-case-converter
- Convert input to: lower, UPPER, camelCase, PascalCase, snake_case,
  kebab-case, CONSTANT_CASE, Title Case, Sentence case.
- Show all variants at once; per-line and whole-string modes.

## base64
- Encode/Decode. Variants: standard base64 AND base64url.
- Correct UTF-8 handling (TextEncoder/TextDecoder, not raw btoa/atob).
- Optional: file input → base64 (still fully local).

## clipboard-sharing  [PLACEHOLDER — v1 does nothing]
- Render the tool page + "Coming soon" empty state. No backend, no logic.
- Keep it in the registry so the menu/route exist, but wire no functionality.
