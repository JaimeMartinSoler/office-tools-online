import { stringify as stringifyYaml } from "yaml";
import { parseJson } from "@/lib/json";
import { err, ok, type Result } from "@/lib/result";

/** Convert a JSON document to YAML. */
export function jsonToYaml(input: string): Result<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  try {
    return ok(stringifyYaml(parsed.value, { lineWidth: 0 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not produce YAML: ${message}`);
  }
}
