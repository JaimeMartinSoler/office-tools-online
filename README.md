# Office Tools Online

A fast, **privacy-first** collection of online utilities for developers and office work — data formats (JSON / YAML / XML / CSV), encoding & hashing, text, and date/time tools.

> 🔒 **Every conversion runs entirely in your browser. Nothing is ever uploaded.**
> This isn't a policy promise — it's how the site is built. There is no backend,
> no API, and no telemetry on your data. Open your browser's Network tab and see
> for yourself.

## Tools

| Tool | Category | Description |
| --- | --- | --- |
| **JSON ↔ YAML ↔ XML ↔ CSV** | JSON | Convert, beautify (2/4/tab indent), and minify between JSON, YAML, XML, and CSV, with line/column errors. |
| **JSON ↔ JSON Schema** | JSON | Infer a JSON Schema (draft 2020-12) from a sample, or generate a deterministic sample instance from a schema. |
| **Base64** | Encoding | Standard and URL-safe Base64, correct UTF-8 handling, file → Base64. |
| **Hash Generator** | Encoding | MD5 / SHA / SHA3 / RIPEMD / CRC32 / BLAKE digests & HMAC, plus PBKDF2 / scrypt / bcrypt / Argon2id key derivation. |
| **URL Encoder / Decoder** | Encoding | Percent-encode/decode (component or full URL) and parse a query string into key/value pairs. |
| **Password Generator** | Encoding | Strong random passwords (Web Crypto) with character sets, per-set minimums, and an entropy meter. |
| **Markdown** | Text | Convert HTML or CSV into Markdown, or write Markdown and preview it rendered (Raw / Formatted toggle). |
| **String Case Converter** | Text | camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and more. |
| **Unix Timestamp Converter** | Datetime | Convert Unix timestamps ↔ dates (seconds or milliseconds), with ISO / UTC / local / relative views. |
| **Cron Expression Explainer** | Datetime | Break a cron expression into per-field periodicity and matched values. |
| **Clipboard Sharing** | Misc | Placeholder — coming soon. |

Each tool is **bidirectional** where it makes sense (a direction toggle, like
Base64's Encode/Decode), with on-hover tooltips on every control and a
mode-aware "Load sample". A persistent status line gives live feedback —
**info** while empty, **validated** (green) when the input parses, plus inline
**warning** and **error** banners — so the layout never jumps.

## Why it's private by design

The site is a **fully static export** (`next build` with `output: 'export'`).
There are no server routes, no server actions, and no database — there is simply
nowhere for your data to be sent. The only network activity is loading the
static assets themselves, enforced by a strict Content-Security-Policy
(`connect-src 'self'`) in [`public/_headers`](public/_headers).

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) — static export, one page per tool
- [TypeScript](https://www.typescriptlang.org/) (strict)
- [Tailwind CSS v4](https://tailwindcss.com/) (+ `@tailwindcss/typography`) and shadcn-style UI primitives
- [CodeMirror 6](https://codemirror.net/) for syntax-highlighted editors
- Per-tool libraries, all running in-browser: [`yaml`](https://eemeli.org/yaml/) and
  [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser)
  (YAML/XML), [`hash-wasm`](https://github.com/Daninet/hash-wasm) (hashing & KDFs),
  [`marked`](https://marked.js.org/) + [`DOMPurify`](https://github.com/cure53/DOMPurify)
  (Markdown render) and [`turndown`](https://github.com/mixmark-io/turndown) (HTML→Markdown)
- [`cmdk`](https://cmdk.paco.me/) command palette, [`next-themes`](https://github.com/pacocoursey/next-themes)
  dark mode, [Radix](https://www.radix-ui.com/) tooltips, [`lucide-react`](https://lucide.dev/) icons
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
