import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { indentValue, parseJson, type IndentOption } from "@/lib/json";
import { err, ok, type Result } from "@/lib/result";

export type DataFormat = "json" | "yaml" | "xml";

const XML_OPTS = { ignoreAttributes: false, attributeNamePrefix: "@_" } as const;

function parseInput(input: string, format: DataFormat): Result<unknown> {
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
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not produce ${format.toUpperCase()}: ${message}`);
  }
}

/**
 * Convert between JSON, YAML, and XML. Same-format input is reformatted.
 * `pretty` controls beautify (true) vs minify (false) for JSON/XML output.
 */
export function convertData(
  input: string,
  from: DataFormat,
  to: DataFormat,
  indent: IndentOption = 2,
  pretty = true,
): Result<string> {
  if (input.trim() === "") return err("Input is empty.");
  const parsed = parseInput(input, from);
  if (!parsed.ok) return parsed;
  return serialize(parsed.value, to, indent, pretty);
}

/**
 * True when the input parses as a JSON object or array. Used to warn that a
 * JSON document was placed in the YAML input (every JSON is valid YAML).
 */
export function isJsonObjectOrArray(input: string): boolean {
  const result = parseJson(input);
  return result.ok && result.value !== null && typeof result.value === "object";
}
