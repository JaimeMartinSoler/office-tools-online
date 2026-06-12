# Office Tools Online

A fast, **privacy-first** collection of online utilities for developers and office work — JSON, YAML, encoding, and string tools.

> 🔒 **Every conversion runs entirely in your browser. Nothing is ever uploaded.**
> This isn't a policy promise — it's how the site is built. There is no backend,
> no API, and no telemetry on your data. Open your browser's Network tab and see
> for yourself.

## Tools

| Tool | Description |
| --- | --- |
| **JSON Formatter** | Beautify (2/4/tab indent), minify, and validate JSON with line/column errors. |
| **JSON → YAML** | Convert JSON documents to YAML. |
| **YAML → JSON** | Convert YAML to JSON with configurable indentation. |
| **JSON → JSON Schema** | Infer a JSON Schema (draft 2020-12) from a sample document. |
| **JSON Schema → JSON** | Generate a sample JSON instance from a schema (deterministic, seeded). |
| **Base64 Encode / Decode** | Standard and URL-safe Base64, correct UTF-8 handling, file → Base64. |
| **String Case Converter** | camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and more. |
| **Clipboard Sharing** | Placeholder — coming soon. |

## Why it's private by design

The site is a **fully static export** (`next build` with `output: 'export'`).
There are no server routes, no server actions, and no database — there is simply
nowhere for your data to be sent. The only network activity is loading the
static assets themselves, enforced by a strict Content-Security-Policy
(`connect-src 'self'`) in [`public/_headers`](public/_headers).

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) — static export, one page per tool
- [TypeScript](https://www.typescriptlang.org/) (strict)
- [Tailwind CSS v4](https://tailwindcss.com/) + shadcn-style UI primitives
- [CodeMirror 6](https://codemirror.net/) for syntax-highlighted editors
- [Vitest](https://vitest.dev/) for unit tests
- [pnpm](https://pnpm.io/) for package management

## Getting started

**Prerequisites:** Node.js 20+ and pnpm (`corepack enable pnpm`).

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
