import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { err, ok, type Result } from "@/lib/result";

export type InputFormat = "html" | "csv" | "markdown";

/** Dispatch helper used by the UI. */
export function convertToMarkdown(
  input: string,
  format: InputFormat,
): Result<string> {
  switch (format) {
    case "html":
      return htmlToMarkdown(input);
    case "csv":
      return csvToMarkdown(input);
    case "markdown":
      // Markdown in → Markdown out is a passthrough; the Formatted view renders
      // it. Normalising line endings keeps the editor and preview consistent.
      return ok(input.replace(/\r\n/g, "\n").trim());
  }
}

/**
 * Render Markdown to an HTML string for the Formatted preview. Pure and
 * Node-safe (marked needs no DOM); the caller sanitises the result with
 * DOMPurify before inserting it into the document. GFM (tables, etc.) is on by
 * default in marked.
 */
export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false });
}

// --- HTML → Markdown -------------------------------------------------------

// turndown uses the browser's DOMParser when bundled for the client (no network,
// satisfies the zero-egress constraint) and its bundled DOM (@mixmark-io/domino)
// in Node, so this stays pure/framework-agnostic and is testable in plain Node.
function createTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  // GFM adds tables, strikethrough and task lists.
  service.use(gfm);
  return service;
}

export function htmlToMarkdown(input: string): Result<string> {
  try {
    const markdown = createTurndown().turndown(input);
    return ok(markdown.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not convert HTML: ${message}`);
  }
}

// --- CSV → Markdown table --------------------------------------------------

const DELIMITERS = [",", "\t", ";"] as const;
type Delimiter = (typeof DELIMITERS)[number];

/** Pick the delimiter that appears most on the first line; default comma. */
function detectDelimiter(input: string): Delimiter {
  const firstLine = input.split(/\r?\n/, 1)[0] ?? "";
  let best: Delimiter = ",";
  let bestCount = -1;
  for (const delimiter of DELIMITERS) {
    const count = firstLine.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Parse CSV into a matrix of rows. Handles quoted fields with embedded
 * delimiters, newlines, and "" escaped quotes (RFC 4180).
 */
function parseCsv(input: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let started = false;

  const pushField = () => {
    row.push(field);
    field = "";
    started = true;
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
    started = false;
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      started = true;
    } else if (char === delimiter) {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      // Swallow CR; the following LF (if any) ends the row.
      if (input[i + 1] !== "\n") pushRow();
    } else {
      field += char;
    }
  }
  // Flush the trailing field/row unless the input ended on a clean line break.
  if (started || field !== "" || row.length > 0) pushRow();

  return rows;
}

/** Escape a value for use inside a Markdown table cell. */
function escapeCell(value: string): string {
  return value
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>")
    .trim();
}

export function csvToMarkdown(input: string): Result<string> {
  if (input.trim() === "") return err("Input is empty.");

  const delimiter = detectDelimiter(input);
  const rows = parseCsv(input, delimiter).filter(
    (row) => row.length > 1 || (row[0] ?? "").trim() !== "",
  );

  if (rows.length === 0) return err("No CSV rows found.");

  const header = rows[0] ?? [];
  const columns = header.length;
  if (columns === 0) return err("No columns found in the header row.");

  const toLine = (cells: string[]): string => {
    const padded = Array.from({ length: columns }, (_, i) =>
      escapeCell(cells[i] ?? ""),
    );
    return `| ${padded.join(" | ")} |`;
  };

  const lines = [
    toLine(header),
    `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`,
    ...rows.slice(1).map(toLine),
  ];

  return ok(lines.join("\n"));
}

// --- Format detection (for the non-blocking mismatch notice) ---------------

/** Confident HTML signal: a real tag like <p>, <div>, <br/> or <table>. */
export function looksLikeHtml(input: string): boolean {
  return /<\/?[a-z][a-z0-9]*(\s[^<>]*)?\/?>/i.test(input);
}

/**
 * Confident CSV signal: multiple non-empty lines that share a consistent
 * delimiter count (≥1) — and that don't look like HTML.
 */
export function looksLikeCsv(input: string): boolean {
  if (looksLikeHtml(input)) return false;
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  if (lines.length < 2) return false;

  const delimiter = detectDelimiter(input);
  const counts = lines.map((line) => line.split(delimiter).length - 1);
  return counts[0]! > 0 && counts.every((count) => count === counts[0]);
}
