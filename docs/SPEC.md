# Product Spec — Office Tools Online

## Vision
A fast, privacy-first collection of online tools for developers and office users.
Every conversion happens locally in the browser. Nothing is uploaded — ever.

## Principles
1. **Privacy by architecture** — static site, no backend, no telemetry on content.
2. **Instant** — no round-trips; conversions run on keystroke (debounced).
3. **Composable** — new tools are cheap to add (registry pattern).
4. **Dev-grade UX** — keyboard friendly, copy buttons, sample data, clear errors,
   dark mode, deep-linkable routes (/tools/<slug>).

## v1 Tools
See docs/TOOLS.md.

## Global UX requirements
- Persistent sidebar (grouped by category) + command-palette search (Cmd/Ctrl-K).
- Each tool: input pane, output pane, action bar (copy, clear, load sample, swap).
- A single always-present status banner gives live feedback (priority
  error > warning > info > validated), so validation is visible inline — never
  thrown to console only — and the layout never shifts as messages come and go.
- Controls carry on-hover tooltips; mode-dependent controls are disabled/grayed
  rather than hidden.
- A visible "🔒 100% client-side — your data never leaves this browser" badge + /privacy page.

## Out of scope (v1)
- Accounts, persistence beyond localStorage prefs, any server feature.
- Clipboard Sharing tool ships as a non-functional placeholder (see TOOLS.md).
