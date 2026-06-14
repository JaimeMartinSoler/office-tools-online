import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { indentValue, parseJson, type IndentOption } from "@/lib/json";
import { err, ok, type Result } from "@/lib/result";

export type DataFormat = "json" | "yaml" | "xml" | "csv";

const XML_OPTS = { ignoreAttributes: false, attributeNamePrefix: "@_" } as const;

/** Options that only matter when CSV is the input or output format. */
export interface CsvOptions {
  /** Flatten nested objects/arrays instead of erroring on them. */
  nested: boolean;
  /** When parsing CSV, coerce cells to number/boolean/null instead of strings. */
  inferTypes: boolean;
}

function parseInput(
  input: string,
  format: DataFormat,
  csv: CsvOptions,
): Result<unknown> {
  switch (format) {
    case "json":
      return parseJson(input);
    case "yaml": {
      try {
        const value = parseYaml(input);
        if (value === undefined) return err("Input is empty.");
        return ok(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return err(`Invalid YAML: ${message}`);
      }
    }
    case "xml": {
      const valid = XMLValidator.validate(input);
      if (valid !== true) {
        return err(`Invalid XML: ${valid.err.msg} (line ${valid.err.line}).`);
      }
      try {
        return ok(new XMLParser(XML_OPTS).parse(input));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return err(`Invalid XML: ${message}`);
      }
    }
    case "csv":
      return parseCsv(input, csv);
  }
}

/** A value maps cleanly onto XML only when it is an object with one root key. */
function hasSingleRoot(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1
  );
}

function serialize(
  value: unknown,
  format: DataFormat,
  indent: IndentOption,
  pretty: boolean,
  csv: CsvOptions,
): Result<string> {
  try {
    switch (format) {
      case "json":
        return ok(
          pretty
            ? JSON.stringify(value, null, indentValue(indent))
            : JSON.stringify(value),
        );
      case "yaml": {
        // YAML has no compact form and forbids tab indentation, so fall back to
        // 2 spaces for tabs and ignore `pretty`.
        const yamlIndent = indent === "tab" ? 2 : indent;
        return ok(stringifyYaml(value, { lineWidth: 0, indent: yamlIndent }));
      }
      case "xml": {
        const root = hasSingleRoot(value) ? value : { root: value };
        const builder = new XMLBuilder({
          ...XML_OPTS,
          format: pretty,
          ...(pretty
            ? { indentBy: indent === "tab" ? "\t" : " ".repeat(indent) }
            : {}),
        });
        return ok(builder.build(root).trimEnd());
      }
      case "csv":
        return toCsv(value, csv);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not produce ${format.toUpperCase()}: ${message}`);
  }
}

/**
 * Convert between JSON, YAML, XML, and CSV. Same-format input is reformatted.
 * `pretty` controls beautify (true) vs minify (false) for JSON/XML output.
 * `csv` options only take effect when CSV is the input or output format.
 */
export function convertData(
  input: string,
  from: DataFormat,
  to: DataFormat,
  indent: IndentOption = 2,
  pretty = true,
  csv: CsvOptions = { nested: false, inferTypes: false },
): Result<string> {
  if (input.trim() === "") return err("Input is empty.");
  const parsed = parseInput(input, from, csv);
  if (!parsed.ok) return parsed;
  return serialize(parsed.value, to, indent, pretty, csv);
}

/**
 * True when the input parses as a JSON object or array. Used to warn that a
 * JSON document was placed in the YAML input (every JSON is valid YAML).
 */
export function isJsonObjectOrArray(input: string): boolean {
  const result = parseJson(input);
  return result.ok && result.value !== null && typeof result.value === "object";
}

// ---------------------------------------------------------------------------
// CSV — value → CSV
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isObjectLike(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

/** Render a scalar as a CSV cell; null/undefined become an empty cell. */
function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

/**
 * Find the rows that make up the table. Unwraps single-key wrapper objects
 * (e.g. an XML root, or `{ root: [...] }`) until reaching an array of rows or a
 * multi-key object, which becomes a single row.
 */
function detectRows(value: unknown): unknown[] {
  let current = value;
  while (isPlainObject(current)) {
    const entries = Object.entries(current);
    if (entries.length !== 1) break;
    const [, only] = entries[0] ?? [];
    if (Array.isArray(only)) return only;
    if (isPlainObject(only)) {
      current = only;
      continue;
    }
    break; // single key with a scalar value — treat the object as one row
  }
  return Array.isArray(current) ? current : [current];
}

/**
 * Flatten one field into `[flatKey, cell]` pairs. Without `nested`, any
 * object/array value is an error. With `nested`, nested objects produce dotted
 * keys, scalar arrays join with ",", and arrays that contain objects are
 * embedded as a compact JSON string.
 */
function flattenField(
  key: string,
  value: unknown,
  nested: boolean,
): Result<[string, string][]> {
  if (!isObjectLike(value)) {
    return ok([[key, cellString(value)]]);
  }
  if (!nested) {
    return err(
      `Field "${key}" is nested — enable "Nested CSV fields" to flatten it, ` +
        `or remove it from the input.`,
    );
  }
  if (Array.isArray(value)) {
    if (value.some(isObjectLike)) {
      // A list of objects has no flat form — embed it losslessly as JSON.
      return ok([[key, JSON.stringify(value)]]);
    }
    return ok([[key, value.map(cellString).join(",")]]);
  }
  const pairs: [string, string][] = [];
  for (const [childKey, childValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const child = flattenField(`${key}.${childKey}`, childValue, nested);
    if (!child.ok) return child;
    pairs.push(...child.value);
  }
  return ok(pairs);
}

/** Escape a CSV field per RFC 4180. */
function escapeCsv(field: string): string {
  return /[",\r\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

function toCsv(value: unknown, csv: CsvOptions): Result<string> {
  const rows = detectRows(value);
  if (rows.length === 0) return err("No rows to convert to CSV.");

  const flatRows: Record<string, string>[] = [];
  const header: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    if (!isPlainObject(row)) {
      throw new Error(
        `each CSV row must be an object, but row ${index + 1} is ` +
          `${Array.isArray(row) ? "an array" : typeof row}.`,
      );
    }
    const flat: Record<string, string> = {};
    for (const [key, val] of Object.entries(row)) {
      const field = flattenField(key, val, csv.nested);
      if (!field.ok) throw new Error(field.error);
      for (const [flatKey, cell] of field.value) {
        flat[flatKey] = cell;
        if (!seen.has(flatKey)) {
          seen.add(flatKey);
          header.push(flatKey);
        }
      }
    }
    flatRows.push(flat);
  });

  const lines = [header, ...flatRows.map((r) => header.map((h) => r[h] ?? ""))];
  return ok(lines.map((cells) => cells.map(escapeCsv).join(",")).join("\n"));
}

// ---------------------------------------------------------------------------
// CSV → value
// ---------------------------------------------------------------------------

/** Split CSV text into rows of raw string fields (RFC 4180). */
function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
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
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else {
      field += char;
    }
  }
  // Flush a trailing field/row unless the text ended on a row delimiter.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** A row that is entirely empty (a blank line) carries no data. */
function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell === "");
}

function inferType(raw: string): unknown {
  if (raw === "") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
  }
  return raw;
}

/** Assign a possibly dotted key path into `target`, creating nested objects. */
function assignNested(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split(".");
  const leaf = keys.pop() ?? path;
  let node = target;
  for (const key of keys) {
    if (!isPlainObject(node[key])) {
      node[key] = {};
    }
    node = node[key] as Record<string, unknown>;
  }
  node[leaf] = value;
}

function parseCsv(input: string, csv: CsvOptions): Result<unknown> {
  const rows = splitCsvRows(input).filter((row) => !isBlankRow(row));
  const [header, ...dataRows] = rows;
  if (header === undefined) return err("CSV has no header row.");

  const records = dataRows.map((row) => {
    const record: Record<string, unknown> = {};
    header.forEach((key, index) => {
      const raw = row[index] ?? "";
      const value = csv.inferTypes ? inferType(raw) : raw;
      if (csv.nested) {
        assignNested(record, key, value);
      } else {
        record[key] = value;
      }
    });
    return record;
  });

  return ok(records);
}
