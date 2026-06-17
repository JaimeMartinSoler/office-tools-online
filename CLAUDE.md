# Office Tools Online

Client-side-only web app offering dev/office utilities (JSON, YAML, encoding, string tools).

## Workflow (every new request, unless told otherwise)
1. **Verify the branch.** The base for new work is `develop`. If the current
   branch is not `develop`, stop and tell me before doing anything else.
2. **Branch off.** Create `feature/<short-descriptive-slug>` for the request and
   do all work there. If the same request grows into more changes, keep using
   that branch — do NOT open a new one.
3. **Develop, don't publish.** Make the changes (and run `pnpm test` / `pnpm lint`)
   on that branch. Do not commit, push, or open a PR yet.
4. **Hand off.** When the work is done, ask me before committing — then, on my
   go-ahead, commit + push the branch and open a PR into `develop`.

Never push directly to `main` (I own `develop` → `main`, and `main` triggers the
Cloudflare deploy).

## Inviolable constraints
- **ZERO data egress.** All conversion runs in the browser. No fetch/XHR/WebSocket
  sends user input anywhere. No analytics that capture tool content. No SSR of user data.
  If a feature seems to need a server, stop and flag it — it almost certainly doesn't.
- Fully static build (`next build` + `output: 'export'`). No API routes, no server actions.

## Architecture
- Tools are registered in `src/tools/registry.ts`. Each tool lives in `src/tools/<slug>/`
  with: `index.tsx` (UI), `logic.ts` (pure functions), `logic.test.ts`.
- UI never contains conversion logic. Logic files import nothing from React/DOM.
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

## Conventions
- TypeScript strict. No `any`. Pure functions return `Result<T>` (`{ok,value}|{ok:false,error}`),
  never throw for user-input errors — surface them in the UI.
- Every logic.ts has a co-located test. Run `pnpm test` before claiming done.
- Each tool page sets its own <title>/meta description for SEO.

## Commands
- `pnpm dev` / `pnpm build` / `pnpm test` / `pnpm lint`
- Native build scripts (esbuild, sharp, unrs-resolver) are pre-approved in
  `pnpm-workspace.yaml` (`onlyBuiltDependencies`). If a new dep needs a build
  script, add it there — otherwise pnpm blocks it and the pre-run check fails.
- **`next build` WASM-hash workaround.** Webpack's bundled WASM xxhash crashes
  during build (`WasmHash._updateWithBuffer` → `Cannot read properties of
  undefined (reading 'length')`) in this Next version — on *every* Node version
  tested (20–24), so it is NOT a Node-version issue. Fixed in `next.config.mjs`
  by forcing `config.output.hashFunction = "sha256"` (Node crypto instead of the
  wasm hasher); keep that override. `pnpm test` / `pnpm lint` never hit this
  path, so a green test+lint with a failing build points at this, not your code.
