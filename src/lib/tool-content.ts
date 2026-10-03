/**
 * Below-the-fold reference content for a tool page ("What this tool does",
 * steps, worked examples, FAQ, related tools).
 *
 * Each tool keeps its copy in a co-located `src/tools/<slug>/content.ts` (pure
 * data — no React), the registry attaches it as `Tool.content`, and ONE source
 * feeds both the visible `ToolArticle` and the FAQPage / HowTo JSON-LD, so the
 * structured data can never describe text that isn't on the page.
 *
 * Prose fields accept a tiny inline markup — `` `code` ``, `**control name**`,
 * and `[label](/internal/path/)` links — rendered by `ToolArticle` and
 * flattened to plain text for JSON-LD by `inlineToPlainText`.
 */

/** Prose with optional `` `code` ``, `**strong**`, and `[label](/path/)` spans. */
export type InlineText = string;

export interface ToolExample {
  /** Short heading, e.g. "Decode a Base64URL token segment". */
  title: InlineText;
  /** Optional one-liner naming the mode/options used. */
  note?: InlineText;
  input: string;
  output: string;
  /** Pane captions; default "Input" / "Output". */
  inputLabel?: string;
  outputLabel?: string;
}

export interface FaqEntry {
  question: string;
  answer: InlineText;
}

export interface ToolContent {
  /** "What this tool does" — 2–4 concrete sentences. */
  intro: InlineText;
  /** "How to use it" — 3–5 steps. */
  steps: InlineText[];
  /** Worked examples: real input → real output (checked by content-examples.test.ts). */
  examples: ToolExample[];
  /** 4–6 questions, answered in 2–4 sentences each. */
  faq: FaqEntry[];
  /** A sentence or two linking 2–3 genuinely related tools. */
  related: InlineText;
}

export type InlineNode =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "link"; text: string; href: string };

const INLINE_TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Split inline markup into text, code, and link nodes. */
export function parseInline(source: InlineText): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push({ kind: "text", text: source.slice(last, index) });
    if (match[1] !== undefined) {
      nodes.push({ kind: "code", text: match[1] });
    } else if (match[2] !== undefined) {
      nodes.push({ kind: "strong", text: match[2] });
    } else {
      nodes.push({ kind: "link", text: match[3] ?? "", href: match[4] ?? "" });
    }
    last = index + match[0].length;
  }
  if (last < source.length) nodes.push({ kind: "text", text: source.slice(last) });
  return nodes;
}

/** The text a reader sees, with markup removed — used for JSON-LD. */
export function inlineToPlainText(source: InlineText): string {
  return parseInline(source)
    .map((node) => node.text)
    .join("");
}

/** Every link target in a tool's content (for dead-link tests). */
export function contentLinks(content: ToolContent): string[] {
  const prose = [
    content.intro,
    content.related,
    ...content.steps,
    ...content.examples.flatMap((e) => [e.title, e.note ?? ""]),
    ...content.faq.map((f) => f.answer),
  ];
  return prose.flatMap((text) =>
    parseInline(text).flatMap((node) => (node.kind === "link" ? [node.href] : [])),
  );
}
