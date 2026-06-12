# Architecture

## Routing
- /                      → landing + tool grid (from registry)
- /tools/[slug]          → renders registry[slug].component
- /privacy               → privacy/security statement

## Tool registry (src/tools/registry.ts)
type Tool = {
  slug: string; name: string; description: string;
  category: 'JSON' | 'Encoding' | 'Text' | 'Misc';
  keywords: string[];
  status?: 'stable' | 'placeholder';
  Component: React.ComponentType;
}
export const tools: Tool[] = [ ... ]

Sidebar, search palette, homepage cards, and static params for /tools/[slug]
are ALL derived from `tools`. Never hardcode a tool list twice.

## Result type (src/lib/result.ts)
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

## Static export & privacy hardening
- next.config: output:'export', images.unoptimized:true.
- Set a strict CSP via hosting headers: default-src 'self'; connect-src 'self';
  no third-party origins. Document chosen host's header file.
- No runtime fetch of user data. Allowed network: static asset loads only.

## Testing
- Vitest unit tests per logic.ts. Aim for the conversion edge cases
  (empty input, invalid input, unicode, large input, base64url padding).
