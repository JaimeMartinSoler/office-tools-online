import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Converts HTML to Markdown and CSV to Markdown tables, and previews Markdown as rendered HTML. The HTML converter writes `#`-style headings, fenced code blocks and `-` bullets, and supports GitHub-flavored tables, strikethrough and task lists. The CSV converter detects whether the delimiter is a comma, tab or semicolon, respects quoted fields, and escapes `|` characters so they can't break the table. Switching the output to **Formatted** renders the result, sanitised, in the page.",
  steps: [
    "Choose the input format: **HTML**, **CSV**, or **Markdown** (to preview Markdown you already have).",
    "Paste the source. For CSV, the first row becomes the table header.",
    "Keep the output on **Raw** to copy the Markdown source, or switch to **Formatted** to check how it renders.",
    "Copy the Markdown into your README, wiki, issue or pull request.",
  ],
  examples: [
    {
      title: "An HTML fragment to Markdown",
      note: "Input HTML. Inline `<code>` becomes backticks and links keep their URL. Note that the list markers are followed by three spaces.",
      input:
        '<h2>Install</h2>\n<p>Run <code>pnpm install</code>, then <a href="https://pnpm.io">read the docs</a>.</p>\n<ul><li><strong>Fast</strong></li><li>Strict</li></ul>',
      output: "## Install\n\nRun `pnpm install`, then [read the docs](https://pnpm.io).\n\n-   **Fast**\n-   Strict",
    },
    {
      title: "An HTML table to a GitHub-flavored table",
      note: "Input HTML. The `<thead>` row becomes the header row.",
      input:
        "<table>\n  <thead><tr><th>Tool</th><th>Runs</th></tr></thead>\n  <tbody>\n    <tr><td>Base64</td><td>Browser</td></tr>\n    <tr><td>Hash</td><td>WASM</td></tr>\n  </tbody>\n</table>",
      output: "| Tool | Runs |\n| --- | --- |\n| Base64 | Browser |\n| Hash | WASM |",
    },
    {
      title: "A semicolon-separated CSV export to a table",
      note: "Input CSV. The `;` delimiter is detected automatically, and the `|` inside the quoted field is escaped.",
      input: 'name;role;note\nAda;Engineer;"first | program"\nGrace;Admiral;COBOL',
      output: "| name | role | note |\n| --- | --- | --- |\n| Ada | Engineer | first \\| program |\n| Grace | Admiral | COBOL |",
    },
  ],
  faq: [
    {
      question: "Which Markdown flavor does it produce?",
      answer:
        "CommonMark with the GitHub-flavored extensions: pipe tables, `~strikethrough~`, and `- [ ]` task lists. Headings use `#` rather than underlines, and code blocks are fenced with triple backticks, keeping the `language-` class as the fence's language. This is what GitHub, GitLab and most wikis render.",
    },
    {
      question: "Why does my CSV table have the wrong columns?",
      answer:
        "The delimiter is detected from the first line by counting commas, tabs and semicolons, and the most frequent one wins. If a header contains more commas than your real separator, the guess is wrong. Quote those header cells, or replace the separator. Rows with fewer cells than the header are padded with empty cells.",
    },
    {
      question: "Can a CSV cell contain a line break?",
      answer:
        "Yes, if the field is quoted, as in RFC 4180. Markdown table cells can't span lines, so the line break is written as `<br>`, which GitHub and most renderers display as a line break inside the cell. Doubled quotes (`\"\"`) inside a quoted field become a single `\"`.",
    },
    {
      question: "Is the Formatted preview safe with untrusted HTML?",
      answer:
        "The preview's HTML is passed through DOMPurify before it is inserted, which removes scripts, event handlers and other active content. The page's Content-Security-Policy also blocks external images and requests, so remote images in the Markdown show as broken rather than loading.",
    },
    {
      question: "What happens to HTML that has no Markdown equivalent?",
      answer:
        "Structural tags such as headings, paragraphs, lists, links, emphasis, code, blockquotes and tables are converted. Purely presentational markup — inline styles, classes, `<span>` and `<div>` wrappers — is dropped, and only the text is kept. Check the Formatted view to confirm that nothing important was lost.",
    },
  ],
  related:
    "If your table starts life as JSON, convert it to CSV with the [JSON Formatter & Converter](/tools/json-yaml-xml/) first, then paste the CSV here. To compare two versions of a README, use the [Text Diff](/tools/text-diff/).",
};
