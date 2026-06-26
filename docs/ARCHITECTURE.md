# Architecture

## Routing
- /                      → landing + tool grid (from registry)
- /tools/[slug]          → renders registry[slug].Component
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

Sidebar, search palette, homepage cards, and static params for /tools/[slug]
are ALL derived from `tools`. Never hardcode a tool list twice.

## Result type (src/lib/result.ts)
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

## Shared UI primitives (src/components/)
- ConverterTool — single-input → single-output shell (debounced convert, panes).
- StatusBanner — the one always-on status line; kinds info | validated | warning |
  error, priority error > warning > info > validated. ConverterTool drives it;
  bespoke tools render it directly.
- Hint / Segmented `hint` — on-hover tooltips (Hint works on disabled controls).

## Static export & privacy hardening
- next.config: output:'export', images.unoptimized:true.
- Set a strict CSP via hosting headers: default-src 'self'; connect-src 'self'
  + Cloudflare Web Analytics origin (cloudflareinsights.com) only. Document
  chosen host's header file.
- No runtime fetch of USER data. Allowed network: static asset loads, plus an
  anonymous, cookieless visit beacon (Cloudflare Web Analytics — auto-injected
  at the edge, no code/token; reports URL/referrer/device class, never tool
  content). This is "zero egress of user data", not "zero egress".

## Testing
- Vitest unit tests per logic.ts. Aim for the conversion edge cases
  (empty input, invalid input, unicode, large input, base64url padding).
