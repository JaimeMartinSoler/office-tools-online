import { err, ok, type Result } from "@/lib/result";

export type IndentOption = 2 | 4 | "tab";

function indentValue(indent: IndentOption): string | number {
  return indent === "tab" ? "\t" : indent;
}

/** Convert a character offset into 1-based line/column for error messages. */
function lineColFromOffset(
  source: string,
  offset: number,
): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const max = Math.min(offset, source.length);
  for (let i = 0; i < max; i++) {
    if (source[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

/** Parse JSON, returning a clean error with line/column instead of throwing. */
export function parseJson(input: string): Result<unknown> {
  if (input.trim() === "") {
    return err("Input is empty.");
  }
  try {
    return ok(JSON.parse(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const offsetMatch = message.match(/position (\d+)/);
    if (offsetMatch?.[1] !== undefined) {
      const offset = Number(offsetMatch[1]);
      const { line, column } = lineColFromOffset(input, offset);
      const reason = message.replace(/\s*in JSON at position.*$/, "");
      return err(`Invalid JSON: ${reason} (line ${line}, column ${column}).`);
    }
    return err(`Invalid JSON: ${message}`);
  }
}

/** Pretty-print JSON with the chosen indentation. */
export function beautify(input: string, indent: IndentOption = 2): Result<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return ok(JSON.stringify(parsed.value, null, indentValue(indent)));
}

/** Collapse JSON to a single line. */
export function minify(input: string): Result<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return ok(JSON.stringify(parsed.value));
}

/** Validate JSON, returning ok(true) or a descriptive error. */
export function validate(input: string): Result<true> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return ok(true);
}
