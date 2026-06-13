"use client";

import { useCallback, useState } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { Segmented } from "@/components/segmented";
import {
  convertToMarkdown,
  looksLikeCsv,
  looksLikeHtml,
  type InputFormat,
} from "./logic";
import { MarkdownPreview } from "./preview";

type OutputView = "raw" | "formatted";

const SAMPLES: Record<InputFormat, string> = {
  html: `<h1>Office Tools</h1>
<p>Convert <strong>HTML</strong> or <em>CSV</em> to Markdown.</p>
<ul>
  <li>Runs <a href="https://example.com">in your browser</a></li>
  <li>No data leaves the page</li>
</ul>
<table>
  <thead><tr><th>Tool</th><th>Input</th></tr></thead>
  <tbody>
    <tr><td>Markdown</td><td>HTML / CSV</td></tr>
  </tbody>
</table>`,
  csv: `name,role,city
Ada Lovelace,Engineer,London
"Grace Hopper",Admiral,"New York, NY"
Alan Turing,Mathematician,Manchester`,
  markdown: `# Office Tools

Write **Markdown** and switch the output to *Formatted* to preview it.

- Runs entirely in your browser
- Supports [links](https://example.com), \`code\`, and tables

| Tool | Input |
| --- | --- |
| Markdown | HTML / CSV / Markdown |`,
};

const HTML_IN_CSV_NOTICE =
  "This input looks like HTML, not CSV. CSV → Markdown builds a table from delimited rows — if you meant to convert HTML, switch the Input format to HTML.";
const CSV_IN_HTML_NOTICE =
  "This input looks like CSV, not HTML. HTML → Markdown expects markup with tags — if you meant to convert CSV, switch the Input format to CSV.";

const FORMATS: { label: string; value: InputFormat; hint: string }[] = [
  {
    label: "HTML",
    value: "html",
    hint: "Convert HTML markup to Markdown (headings, lists, links, code, and tables).",
  },
  {
    label: "CSV",
    value: "csv",
    hint: "Convert comma/tab/semicolon-separated rows into a Markdown table (first row is the header).",
  },
  {
    label: "Markdown",
    value: "markdown",
    hint: "Write raw Markdown and switch the output to Formatted to preview it.",
  },
];

const VIEWS: { label: string; value: OutputView; hint: string }[] = [
  {
    label: "Raw",
    value: "raw",
    hint: "Show the Markdown source text.",
  },
  {
    label: "Formatted",
    value: "formatted",
    hint: "Render the Markdown as a styled preview (sanitised, fully in your browser).",
  },
];

const PLACEHOLDERS: Record<InputFormat, string> = {
  html: "Paste HTML…",
  csv: "Paste CSV rows…",
  markdown: "Write Markdown…",
};

export function MarkdownTool() {
  const [format, setFormat] = useState<InputFormat>("html");
  const [view, setView] = useState<OutputView>("raw");

  const convert = useCallback(
    (input: string) => convertToMarkdown(input, format),
    [format],
  );

  const warn = useCallback(
    (input: string) => {
      if (format === "csv" && looksLikeHtml(input)) return HTML_IN_CSV_NOTICE;
      if (format === "html" && looksLikeCsv(input)) return CSV_IN_HTML_NOTICE;
      return null;
    },
    [format],
  );

  return (
    <ConverterTool
      title="Markdown"
      description="Convert HTML or CSV to Markdown, or preview Markdown — entirely in your browser."
      sample={SAMPLES[format]}
      convert={convert}
      warn={warn}
      validatedMessage={`Looks good — valid ${format.toUpperCase()}.`}
      inputLabel="Input"
      outputLabel="Markdown"
      inputPlaceholder={PLACEHOLDERS[format]}
      inputControls={
        <Segmented
          aria-label="Input format"
          options={FORMATS}
          value={format}
          onChange={setFormat}
        />
      }
      outputControls={
        <Segmented
          aria-label="Output view"
          options={VIEWS}
          value={view}
          onChange={setView}
        />
      }
      renderOutput={
        view === "formatted"
          ? (output) => <MarkdownPreview markdown={output} />
          : undefined
      }
    />
  );
}
