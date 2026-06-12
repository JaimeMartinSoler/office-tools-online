import { parse as parseYaml } from "yaml";
import { indentValue, type IndentOption } from "@/lib/json";
import { err, ok, type Result } from "@/lib/result";

/** Convert a YAML document to JSON. */
export function yamlToJson(
  input: string,
  indent: IndentOption = 2,
): Result<string> {
  if (input.trim() === "") return err("Input is empty.");
  let value: unknown;
  try {
    value = parseYaml(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Invalid YAML: ${message}`);
  }
  if (value === undefined) {
    return err("Input is empty.");
  }
  try {
    return ok(JSON.stringify(value, null, indentValue(indent)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not produce JSON: ${message}`);
  }
}
