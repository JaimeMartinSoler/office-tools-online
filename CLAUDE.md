# Office Tools Online

Client-side-only web app offering dev/office utilities (JSON, YAML, encoding, string tools).

## Workflow (every new request, unless told otherwise)
Follow the process rules in `.claude/rules/`, in order:
1. [`git-branching.md`](.claude/rules/git-branching.md): one `<type>/<slug>` branch off `develop` per request.
2. [`run-tests.md`](.claude/rules/run-tests.md): `pnpm test` + `pnpm lint` green before done.
3. [`update-docs.md`](.claude/rules/update-docs.md): `README.md`, `docs/`, and this file stay true.
4. [`git-commit-push-pr.md`](.claude/rules/git-commit-push-pr.md): commit, push, and open a PR into `develop`.

**Project overrides.** These win over the rules, including inside subagents:
- If the current branch is not `develop` when a new request starts, stop and
  tell me before doing anything else. Don't switch branches yourself.
- Never commit, push, or open a PR without my go-ahead. When the work is done, ask.
- Never push to `main`. I own `develop` → `main`, and `main` triggers the
  Cloudflare deploy.

## Subagents (`.claude/agents/`)
- [`requirement-implementer`](.claude/agents/requirement-implementer.md): takes one scoped requirement end to end (subject to the overrides above).
- [`code-reviewer`](.claude/agents/code-reviewer.md): read-only review of the branch diff against `develop`.
- [`code-explainer`](.claude/agents/code-explainer.md): read-only walkthroughs of how the code works.

## Inviolable constraints
- **ZERO USER-data egress.** All conversion runs in the browser. No fetch/XHR/WebSocket
  sends user input anywhere. No analytics that capture tool content. No SSR of user data.
  If a feature seems to need a server, stop and flag it — it almost certainly doesn't.
  The ONLY permitted egress is Cloudflare Web Analytics: a cookieless, edge-injected
  beacon that sends an anonymous page-view (URL, referrer, coarse device class) and
  NEVER tool content. It is allowlisted in `public/_headers` (script-src
  static.cloudflareinsights.com, connect-src cloudflareinsights.com) and requires no
  code or token here — Cloudflare injects it automatically when enabled in the dashboard.
- Fully static build (`next build` + `output: 'export'`). No API routes, no server actions.

## Architecture
- Tools are registered in `src/tools/registry.ts`. Each tool lives in `src/tools/<slug>/`
  with: `index.tsx` (UI), `logic.ts` (pure functions), `logic.test.ts`, and
  `content.ts` (below-the-fold copy, pure data). Menu entries
  that live on another site (e.g. Clipboard Sharing) go in `externalTools` instead:
  no route or page, they open their `url` in a new tab.
- UI never contains conversion logic. Logic files import nothing from React/DOM.
- **Tool page content.** `content.ts` feeds both `ToolArticle` (rendered below
  the tool) and the FAQPage/HowTo JSON-LD — one source, never a second copy.
  Examples must be real `logic.ts` output: add each to
  `src/tools/content-examples.test.ts`. Write only what the logic does; no
  filler. Nothing new goes above the tool: `ToolLayout` is `min-h-full` so the
  tool fills the first screen and everything else starts below the fold.
- Client components (sidebar, command palette) never import the registry; the
  server passes them `MenuLink` data (`menuLinkGroups()` / `menuLinks()`), so
  tool content stays out of the client JS.
- Shared UI primitives in `src/components/`. shadcn/ui in `src/components/ui/`.
- Framework-agnostic helpers live in `src/lib/` — `Result` (`result.ts`) and JSON
  parsing with line/column errors (`json.ts`). Reuse these instead of re-deriving.
- Simple single-input → single-output tools reuse `src/components/converter-tool.tsx`
  (`ConverterTool`). Its `convert` prop MUST be wrapped in `useCallback`, or the
  debounced effect resets every render. Tools with bespoke UIs (e.g. base64,
  string-case) compose the editor/copy/layout primitives directly.
- Status feedback uses `src/components/status-banner.tsx` (`StatusBanner`): exactly
  ONE banner is always shown — `error > warning > info > validated` — so the panes
  never jump. `ConverterTool` renders it automatically (pass `validatedMessage` /
  `infoMessage` / `warn`); bespoke tools render `StatusBanner` themselves.
- Controls explain themselves on hover: per-option `hint` on `Segmented`, or wrap
  any control in `Hint` (`src/components/hint.tsx`) — its span trigger works even
  on disabled controls. Context-dependent controls are disabled/grayed, not hidden,
  to keep the toolbar stable.
- **Theme tokens / sibling-site style parity.** The look is shared with the sibling
  app `clipboard-sharing-online`, whose `docs/STYLE_MIGRATION.md` is the source of
  truth for cross-site style changes (dated, replayable entries). Tokens are
  shadcn-style HSL triples in `src/app/globals.css`, layered one lightness step
  apart: `--background`/`--card` = body + panels, `--secondary` = header bar
  (incl. the sidebar's logo strip), `--muted` = header pills (`HEADER_PILL_CLASS`
  in `client-side-badge.tsx`) and other raised badges, `--accent` = their hover.
  Local rules the sibling doesn't have: selected/toggled-on states (sidebar active
  item, `Segmented`, on/off toggle buttons) use `bg-accent` / Button
  `variant="selected"`, never `bg-secondary`, so a selected control never reads
  lighter than a hovered one. Applied through the sibling's **2026-07-09** entry;
  when replaying, apply only the entries dated after that and bump this date.

## Conventions
- TypeScript strict. No `any`. Pure functions return `Result<T>` (`{ok,value}|{ok:false,error}`),
  never throw for user-input errors — surface them in the UI.
- Every logic.ts has a co-located test.
- Each tool page sets its own <title>/meta description for SEO, derived from the
  registry in `src/lib/seo.ts` — give every tool a `seoTitle`; tests keep the
  composed title ≤ 60 chars and description ≤ 160. Tool components take their
  `<h1>`/blurb as `{ title, description }` props, never hardcoded strings.
- Only `GITHUB_REF_NAME=main` builds are indexable (`SITE_INDEXABLE` in
  `src/lib/site.ts`); local/staging builds emit `Disallow: /` + `noindex`.

## Commands
- `pnpm dev` / `pnpm build` / `pnpm test` / `pnpm lint`
- Native build scripts (esbuild, sharp, unrs-resolver) are pre-approved in
  `pnpm-workspace.yaml` (`onlyBuiltDependencies`). If a new dep needs a build
  script, add it there — otherwise pnpm blocks it and the pre-run check fails.
- **`next build` build-hasher workaround.** This Next/webpack version feeds
  `undefined` into the build hasher, which crashes it — on *every* Node version
  tested (20–24), so it is NOT a Node-version issue. The symptom shifts by Next
  patch: the bundled WASM xxhash fails as `WasmHash._updateWithBuffer` →
  `Cannot read properties of undefined (reading 'length')`, while Node's crypto
  hasher fails as `ERR_INVALID_ARG_TYPE: "data" argument ... Received undefined`.
  Fixed in `next.config.mjs` by overriding `config.output.hashFunction` with a
  crypto-backed SHA-256 hash *constructor* that no-ops on `undefined`/`null`
  updates (a plain `"sha256"` string is NOT enough — it still throws on the
  undefined input); keep that override. `pnpm test` / `pnpm lint` never hit this
  path, so a green test+lint with a failing build points at this, not your code.
