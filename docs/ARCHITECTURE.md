# Architecture

## Routing
- /                      → landing + tool grid (from registry)
- /tools/[slug]          → renders registry[slug].component
- /privacy               → privacy/security statement

## Tool registry (src/tools/registry.ts)
type Tool = {
  slug: string; name: string; description: string;
  category: 'JSON' | 'Encoding' | 'Text' | 'Datetime' | 'Misc';
  keywords: string[];
  status?: 'stable' | 'placeholder';
  Component: React.ComponentType;
}
export const tools: Tool[] = [ ... ]

Categories render (sidebar + homepage) in the `toolCategories` order:
JSON, Encoding, Text, Datetime, Misc.

Sidebar, search palette, homepage cards, and static params for /tools/[slug]
are ALL derived from `tools`. Never hardcode a tool list twice.

## Result type (src/lib/result.ts)
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

## Shared UI primitives (src/components/)
- ConverterTool — single-input → single-output shell (debounced convert, panes).
  Optional `renderOutput(output)` swaps the read-only editor for a custom view
  (Markdown preview, a results `<table>`); `inputControls`/`outputControls` add
  selectors under a pane label. Tools needing richer state (base64, hash-generator,
  url, password-generator, unix-timestamp, cron-expression) are bespoke — they
  compose ToolLayout/ToolPanes/CodeEditor/StatusBanner directly.
- StatusBanner — the one always-on status line; kinds info | validated | warning |
  error, priority error > warning > info > validated. ConverterTool drives it;
  bespoke tools render it directly.
- Hint / Segmented `hint` — on-hover tooltips (Hint works on disabled controls).
- ui/ primitives: button, input, select, tooltip (shadcn-style).

## Async & crypto logic
- logic.ts may be async (Web Crypto / `hash-wasm`): return `Promise<Result<T>>`
  and use a monotonic run-id so a slow result can't overwrite a newer request.
- Randomness uses `crypto.getRandomValues` with rejection sampling (no
  `Math.random`); pure generators accept an injectable random source for tests.

## Static export & privacy hardening
- next.config: output:'export', images.unoptimized:true.
- Set a strict CSP via hosting headers: default-src 'self'; connect-src 'self';
  no third-party origins. Document chosen host's header file.
- No runtime fetch of user data. Allowed network: static asset loads only.

## Testing
- Vitest unit tests per logic.ts. Aim for the conversion edge cases
  (empty input, invalid input, unicode, large input, base64url padding).
