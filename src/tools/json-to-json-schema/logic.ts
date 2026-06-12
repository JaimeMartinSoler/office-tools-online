import { parseJson } from "@/lib/json";
import { ok, type Result } from "@/lib/result";

export interface InferOptions {
  /** Mark every present property as required. */
  requiredByDefault: boolean;
  /** Emit `enum` for arrays of primitive values. */
  inferEnums: boolean;
}

type SchemaNode = Record<string, unknown>;

const PRIMITIVE_TYPES = ["boolean", "number", "string"];

function stableKey(node: SchemaNode): string {
  return JSON.stringify(node);
}

/** Merge the inferred schemas of multiple array items into one. */
function mergeNodes(nodes: SchemaNode[], opts: InferOptions): SchemaNode {
  if (nodes.length === 0) return {};

  const seen = new Set<string>();
  const unique: SchemaNode[] = [];
  for (const node of nodes) {
    const key = stableKey(node);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(node);
    }
  }
  if (unique.length === 1) return unique[0]!;

  const allObjects = unique.every(
    (n) => n.type === "object" && typeof n.properties === "object",
  );
  if (allObjects) {
    const collected: Record<string, SchemaNode[]> = {};
    const counts: Record<string, number> = {};
    for (const node of nodes) {
      const props = node.properties as Record<string, SchemaNode>;
      for (const [key, value] of Object.entries(props)) {
        (collected[key] ??= []).push(value);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    const merged: Record<string, SchemaNode> = {};
    for (const [key, list] of Object.entries(collected)) {
      merged[key] = mergeNodes(list, opts);
    }
    const result: SchemaNode = { type: "object", properties: merged };
    if (opts.requiredByDefault) {
      const required = Object.keys(counts).filter(
        (key) => counts[key] === nodes.length,
      );
      if (required.length > 0) result.required = required;
    }
    return result;
  }

  return { anyOf: unique };
}

function infer(value: unknown, opts: InferOptions): SchemaNode {
  if (value === null) return { type: "null" };

  const type = typeof value;
  if (type === "boolean") return { type: "boolean" };
  if (type === "number") {
    return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
  }
  if (type === "string") return { type: "string" };

  if (Array.isArray(value)) {
    const items = mergeNodes(
      value.map((entry) => infer(entry, opts)),
      opts,
    );
    if (
      opts.inferEnums &&
      value.length > 0 &&
      value.every((v) => v === null || PRIMITIVE_TYPES.includes(typeof v))
    ) {
      items.enum = [...new Set(value)];
    }
    return { type: "array", items };
  }

  const properties: Record<string, SchemaNode> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    properties[key] = infer(entry, opts);
  }
  const node: SchemaNode = { type: "object", properties };
  if (opts.requiredByDefault) {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length > 0) node.required = keys;
  }
  return node;
}

/** Infer a JSON Schema (draft 2020-12) from a sample JSON document. */
export function inferSchema(input: string, opts: InferOptions): Result<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  const schema: SchemaNode = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...infer(parsed.value, opts),
  };
  return ok(JSON.stringify(schema, null, 2));
}
