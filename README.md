# Office Tools Online

A fast, **privacy-first** collection of online utilities for developers and office work — JSON, YAML, encoding, and string tools.

> 🔒 **Every conversion runs entirely in your browser. Your data is never uploaded.**
> This isn't a policy promise — it's how the site is built. There is no backend,
> no API, and no telemetry on your data. Open your browser's Network tab and see
> for yourself. (The only cross-origin request is an anonymous, cookieless
> visit count — see [Visit analytics](#visit-analytics) — which never sees your
> input.)

## Tools

| Tool | Description |
| --- | --- |
| **JSON ↔ YAML ↔ XML ↔ CSV** | Convert, beautify (2/4/tab indent), and minify between JSON, YAML, XML, and CSV, with line/column errors. |
| **JSON ↔ JSON Schema** | Infer a JSON Schema (draft 2020-12) from a sample, or generate a deterministic sample instance from a schema. |
| **Base64** | Standard and URL-safe Base64, correct UTF-8 handling, file → Base64. |
| **Hash Generator** | Generate hashes, HMACs, and derived keys — MD5, SHA, SHA-3, RIPEMD, CRC32, BLAKE2/3, PBKDF2, scrypt, bcrypt, Argon2. |
| **URL Encoder / Decoder** | Percent-encode or decode text, and parse a URL's query string into key/value pairs. |
| **Password Generator** | Generate strong random passwords — choose length, character sets, and minimums. |
| **Markdown** | Convert HTML or CSV into Markdown. |
| **String Case Converter** | camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and more. |
| **Unix Timestamp Converter** | Convert Unix timestamps to dates and back, in seconds or milliseconds. |
| **Cron Expression Explainer** | Break a cron expression into per-field periodicity and matched values. |
| **Clipboard Sharing** | Placeholder — coming soon. |

Each tool is **bidirectional** where it makes sense (a direction toggle, like
Base64's Encode/Decode), with on-hover tooltips on every control and a
mode-aware "Load sample". A persistent status line gives live feedback —
**info** while empty, **validated** (green) when the input parses, plus inline
**warning** and **error** banners — so the layout never jumps.

## Why it's private by design

The site is a **fully static export** (`next build` with `output: 'export'`).
There are no server routes, no server actions, and no database — there is simply
nowhere for your data to be sent. The only network activity is loading the
static assets themselves plus an anonymous visit count (see below), enforced by
a strict Content-Security-Policy in [`public/_headers`](public/_headers):
`connect-src` permits only `'self'` and Cloudflare's analytics beacon, so your
**input** can never be transmitted anywhere.

## Visit analytics

The site uses [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/),
a **privacy-first, cookieless** way to count visits. The beacon records only the
page URL, referrer, and coarse device/browser class — it **never** reads the
contents of any tool. This is the single intentional exception to "nothing leaves
your browser": anonymous _visit_ data may, but your _input_ data never does.

It is **opt-in at build time**: set `NEXT_PUBLIC_CF_BEACON_TOKEN` to the token
from your Cloudflare Web Analytics site, and the beacon
(`src/app/layout.tsx`) loads. With no token set, no beacon is emitted and the
site makes zero cross-origin requests.

```bash
# Cloudflare Pages → Settings → Environment variables (Production)
NEXT_PUBLIC_CF_BEACON_TOKEN=<your-web-analytics-token>
```

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) — static export, one page per tool
- [TypeScript](https://www.typescriptlang.org/) (strict)
- [Tailwind CSS v4](https://tailwindcss.com/) + shadcn-style UI primitives
- [CodeMirror 6](https://codemirror.net/) for syntax-highlighted editors
- [Vitest](https://vitest.dev/) for unit tests
- [pnpm](https://pnpm.io/) for package management

## Getting started

**Prerequisites:** Node.js 20+ and pnpm (`corepack enable pnpm`).

> **Build note:** `next build` would otherwise crash with
> `TypeError: Cannot read properties of undefined (reading 'length')` inside
> webpack's bundled WASM hasher (`WasmHash`) — a bug in this Next/webpack version
> that reproduces on every Node version (20–24). It's worked around in
> [`next.config.mjs`](next.config.mjs) by forcing
> `output.hashFunction = "sha256"` (Node's crypto hash instead of the wasm one).
> `pnpm test` and `pnpm lint` are unaffected — only the webpack build hashes
> output.

```bash
pnpm install     # install dependencies
pnpm dev         # start the dev server → http://localhost:3000
pnpm test        # run the unit test suite
pnpm lint        # run ESLint
pnpm build       # produce a static export in ./out
```

> **Note:** On the first install, pnpm asks to approve native build scripts
> (esbuild, etc.). These are pre-approved in
> [`pnpm-workspace.yaml`](pnpm-workspace.yaml), so a fresh `pnpm install` runs
> without prompts.

The static site is generated into `./out` — deploy that folder to any static
host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, …). Hosts that read a
`_headers` file (Cloudflare Pages, Netlify) will pick up the security headers
automatically.

## Project structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # app shell (sidebar, header, theme)
│   ├── page.tsx              # landing page (tool grid)
│   ├── privacy/              # privacy & security statement
│   └── tools/[slug]/         # one static page per tool
├── components/               # shared UI (editor, sidebar, command palette…)
│   └── ui/                   # shadcn-style primitives
├── lib/                      # framework-agnostic helpers (Result, JSON parse)
└── tools/
    ├── registry.ts           # single source of truth for all tools
    └── <slug>/
        ├── index.tsx         # the tool's UI (client component)
        ├── logic.ts          # pure conversion functions (no React/DOM)
        └── logic.test.ts     # co-located unit tests
```

## Adding a new tool

1. Create `src/tools/<slug>/` with `logic.ts`, `logic.test.ts`, and `index.tsx`.
   Keep all conversion logic in `logic.ts` as pure functions returning
   `Result<T>` — never throw on user input.
2. For a simple single-input → single-output tool, reuse the shared
   [`ConverterTool`](src/components/converter-tool.tsx) component.
3. Register it in [`src/tools/registry.ts`](src/tools/registry.ts).

That's it — the sidebar, command palette (⌘/Ctrl-K), homepage grid, and the
static route are all derived from the registry automatically.

## License

MIT
