# Architecture

## Routing
- /                      → landing + tool grid (from registry)
- /tools/[slug]          → renders registry[slug].Component
- /privacy               → privacy/security statement
- /about                 → repo link + sibling sites (mirrors clipboard-sharing-online's /about)

## Tool registry (src/tools/registry.ts)
type MenuEntryBase = {
  slug: string; name: string; description: string;
  category: 'JSON' | 'Encoding' | 'Text' | 'Datetime' | 'Misc';
  keywords: string[];
}
type Tool = MenuEntryBase & {           // on-site, rendered at /tools/<slug>
  seoTitle?: string;                    // search-phrased <title>; falls back to name
  h1?: string;                          // on-page heading; falls back to seoTitle, name
  status?: 'stable' | 'placeholder';    // placeholder → "soon" badge
  Component: React.ComponentType<ToolHeaderProps>;  // { title, description }
}
type ExternalTool = MenuEntryBase & { url: string };  // another site, new tab
export const tools: Tool[] = [ ... ]
export const externalTools: ExternalTool[] = [ ... ]  // e.g. Clipboard Sharing
export const menuEntries = [...tools, ...externalTools]

Static params for /tools/[slug], the sitemap, and SEO metadata derive from
`tools`. Sidebar, search palette, and homepage cards derive from `menuEntries`
(via `toolsByCategory()`); `isExternalTool()` tells them to open the entry's
`url` in a new tab with an external-link icon. Never hardcode a tool list twice.

Tool components can't import the registry (it imports them — circular), so
/tools/[slug]/page.tsx passes each one its header: `title` = `toolHeading`
(`h1 ?? seoTitle ?? name`) and `description` = the registry description. The
component forwards both to `ToolLayout`/`ConverterTool`; a test fails if a
tool hardcodes them. Sidebar and command palette keep the short `name`.

## SEO metadata (src/lib/seo.ts, src/lib/site.ts)
- `<title>`: the root layout's default is `DEFAULT_TITLE`; simple pages get
  `"%s · Office Dev Tools"`. Tool pages set `title.absolute` via
  `toolDocumentTitle`: `seoTitle ?? name` plus the brand suffix only when the
  result is ≤ `TITLE_MAX` (60), else the bare tool title.
- Meta description: registry description + `DESCRIPTION_SUFFIX`, ≤ 160 chars;
  descriptions must not repeat the suffix's phrasing. Tests enforce length and
  uniqueness for titles and descriptions.
- Social cards: `summary_large_image` with `/og.png` (1200×630), set in both
  the layout and `toolMetadata` — Next replaces a parent's `twitter` object
  wholesale, so tool pages must declare their own image.
- Indexability: `SITE_INDEXABLE` is true only when `GITHUB_REF_NAME=main`;
  otherwise robots.txt is `Disallow: /` (no sitemap) and pages carry
  `noindex, nofollow`. deploy.yml fails a `main` build whose robots.txt lacks
  `Allow: /`. A static export can't see the request host, so the production
  `<project>.pages.dev` mirror (same `main` build) is still indexable — that
  has to be handled in Cloudflare, not in code.
- Sitemap: no `lastModified` (there's no honest per-page date source).

## Result type (src/lib/result.ts)
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

## Shared UI primitives (src/components/)
- ConverterTool — single-input → single-output shell (debounced convert, panes).
- StatusBanner — the one always-on status line; kinds info | validated | warning |
  error, priority error > warning > info > validated. ConverterTool drives it;
  bespoke tools render it directly.
- Hint / Segmented `hint` — on-hover tooltips (Hint works on disabled controls).

## Theme (src/app/globals.css)
- shadcn-style HSL tokens, layered one lightness step apart: body/panels
  (`--background`, `--card`) → header bar (`--secondary`) → header pills and
  raised badges (`--muted`) → hover and selected states (`--accent`).
- Shared with the sibling app clipboard-sharing-online; its
  `docs/STYLE_MIGRATION.md` is the source of truth for cross-site style changes.

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
