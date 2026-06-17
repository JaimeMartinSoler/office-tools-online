import { parseJson } from "@/lib/json";
import { err, ok, type Result } from "@/lib/result";

// ---------------------------------------------------------------------------
// JSON → JSON Schema (infer a draft 2020-12 schema from a sample document)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// JSON Schema → JSON (generate a sample instance from a schema)
// ---------------------------------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const MAX_DEPTH = 8;

/** Small deterministic PRNG so output is reproducible for a given seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/** Resolve a local `#/...` JSON Pointer reference against the root schema. */
function resolveRef(ref: string, root: Record<string, unknown>): unknown {
  const parts = ref
    .replace(/^#\//, "")
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current: unknown = root;
  for (const part of parts) {
    const obj = asObject(current);
    if (!obj) return undefined;
    current = obj[part];
  }
  return current;
}

/** Combine `allOf` object subschemas into a single object schema. */
function mergeAllOf(list: unknown[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const entry of list) {
    const sub = asObject(entry);
    if (!sub) continue;
    const props = asObject(sub.properties);
    if (props) Object.assign(properties, props);
    if (Array.isArray(sub.required)) {
      for (const r of sub.required) if (typeof r === "string") required.push(r);
    }
  }
  return { type: "object", properties, required };
}

/** JSON Schema type names that the generator knows how to produce. */
const KNOWN_TYPES = [
  "object",
  "array",
  "string",
  "integer",
  "number",
  "boolean",
  "null",
];

/**
 * Keywords whose presence makes a root object look like a usable JSON Schema —
 * i.e. ones the generator can turn into a concrete value. (Constraint-only
 * keywords like `required` or `format` don't qualify on their own.)
 */
const SCHEMA_KEYWORDS = [
  "type",
  "properties",
  "items",
  "prefixItems",
  "enum",
  "const",
  "default",
  "examples",
  "$ref",
  "allOf",
  "anyOf",
  "oneOf",
];

/**
 * Validate that the root looks like a JSON Schema we can generate from.
 * Returns an error message, or `null` when the schema is acceptable.
 */
function validateSchemaRoot(root: Record<string, unknown>): string | null {
  if (!SCHEMA_KEYWORDS.some((key) => key in root)) {
    return 'Not a valid JSON Schema: no recognized schema keywords found (expected one of "type", "properties", "items", "enum", "const", or "$ref"). This looks like plain JSON data rather than a schema.';
  }

  if ("type" in root) {
    const type = root.type;
    const values = Array.isArray(type) ? type : [type];
    const invalid = values.find(
      (value) => typeof value !== "string" || !KNOWN_TYPES.includes(value),
    );
    if (invalid !== undefined) {
      return `Not a valid JSON Schema: unknown "type" value ${JSON.stringify(invalid)}. Expected one of ${KNOWN_TYPES.join(", ")}.`;
    }
  }

  return null;
}

/**
 * Heuristic: does this input look like a JSON Schema rather than plain JSON
 * data? Used to warn (not block) when "JSON → JSON Schema" is selected but the
 * input is itself a schema. Kept deliberately confident to avoid false alarms
 * on ordinary documents that happen to have a `type` or `properties` field.
 */
export function looksLikeJsonSchema(input: string): boolean {
  const parsed = parseJson(input);
  if (!parsed.ok) return false;
  const root = asObject(parsed.value);
  if (!root) return false;

  // Explicit schema markers — essentially never present in plain data.
  if ("$schema" in root || "$defs" in root || "definitions" in root) {
    return true;
  }

  // A root `type` whose value is a JSON-Schema type name is a strong signal:
  // real data rarely sets `type` to exactly "object"/"integer"/etc.
  if ("type" in root) {
    const type = root.type;
    const values = Array.isArray(type) ? type : [type];
    if (
      values.length > 0 &&
      values.every((v) => typeof v === "string" && KNOWN_TYPES.includes(v))
    ) {
      return true;
    }
  }

  // `properties` whose values are all subschema objects.
  const props = asObject(root.properties);
  if (props) {
    const values = Object.values(props);
    if (values.length > 0 && values.every((v) => asObject(v) !== null)) {
      return true;
    }
  }

  return false;
}

/**
 * A pool of plausible, general-purpose strings used when a schema asks for a
 * plain `string` with no `format`. Picking from this (driven by the seeded
 * RNG) means the Regenerate button varies string values, just like it does for
 * numbers and booleans, instead of always emitting the literal "string".
 */
const SAMPLE_STRINGS = [
  "lorem ipsum",
  "Ada Lovelace",
  "hello world",
  "example value",
  "sample text",
  "the quick brown fox",
  "Office Dev Tools",
  "foo bar baz",
  "a short phrase",
  "placeholder",
];

function sampleString(node: Record<string, unknown>, rng: () => number): string {
  switch (asString(node.format)) {
    case "email":
      return "user@example.com";
    case "date-time":
      return "2024-01-01T00:00:00Z";
    case "date":
      return "2024-01-01";
    case "time":
      return "00:00:00";
    case "uuid":
    case "guid":
      return "00000000-0000-4000-8000-000000000000";
    case "uri":
    case "url":
      return "https://example.com";
    case "hostname":
      return "example.com";
    case "ipv4":
      return "127.0.0.1";
    default: {
      let value = SAMPLE_STRINGS[Math.floor(rng() * SAMPLE_STRINGS.length)]!;
      const minLength = asNumber(node.minLength);
      if (minLength !== undefined) {
        while (value.length < minLength) value += "x";
      }
      const maxLength = asNumber(node.maxLength);
      if (maxLength !== undefined && value.length > maxLength) {
        value = value.slice(0, maxLength);
      }
      return value;
    }
  }
}

function gen(
  raw: unknown,
  root: Record<string, unknown>,
  rng: () => number,
  depth: number,
): Json {
  if (depth > MAX_DEPTH) return null;
  const node = asObject(raw);
  if (!node) return null;

  const ref = asString(node.$ref);
  if (ref?.startsWith("#")) {
    return gen(resolveRef(ref, root), root, rng, depth + 1);
  }

  if ("const" in node) return node.const as Json;
  if ("default" in node) return node.default as Json;
  if (Array.isArray(node.examples) && node.examples.length > 0) {
    return node.examples[0] as Json;
  }
  if (Array.isArray(node.enum) && node.enum.length > 0) {
    const index = Math.floor(rng() * node.enum.length);
    return node.enum[index] as Json;
  }

  if (Array.isArray(node.allOf) && node.allOf.length > 0) {
    return gen(mergeAllOf(node.allOf), root, rng, depth);
  }
  for (const key of ["oneOf", "anyOf"] as const) {
    const arr = node[key];
    if (Array.isArray(arr) && arr.length > 0) {
      return gen(arr[0], root, rng, depth + 1);
    }
  }

  let type = node.type;
  if (Array.isArray(type)) type = type[0];

  switch (type) {
    case "object": {
      const props = asObject(node.properties) ?? {};
      const result: { [key: string]: Json } = {};
      for (const [key, sub] of Object.entries(props)) {
        result[key] = gen(sub, root, rng, depth + 1);
      }
      return result;
    }
    case "array": {
      const min = asNumber(node.minItems) ?? 1;
      const count = Math.max(min, 1);
      const items: Json[] = [];
      for (let i = 0; i < count; i++) {
        items.push(gen(node.items, root, rng, depth + 1));
      }
      return items;
    }
    case "string":
      return sampleString(node, rng);
    case "integer": {
      const min = asNumber(node.minimum);
      const max = asNumber(node.maximum);
      if (min !== undefined && max !== undefined) {
        return Math.floor(min + rng() * (max - min + 1));
      }
      if (min !== undefined) return Math.floor(min);
      if (max !== undefined) return Math.floor(max);
      return Math.floor(rng() * 100);
    }
    case "number": {
      const min = asNumber(node.minimum) ?? 0;
      const max = asNumber(node.maximum) ?? min + 100;
      return Math.round((min + rng() * (max - min)) * 100) / 100;
    }
    case "boolean":
      return rng() < 0.5;
    case "null":
      return null;
    default:
      if (asObject(node.properties)) {
        return gen({ ...node, type: "object" }, root, rng, depth);
      }
      if ("items" in node) {
        return gen({ ...node, type: "array" }, root, rng, depth);
      }
      return null;
  }
}

/** Generate a sample JSON instance from a JSON Schema. */
export function schemaToSample(input: string, seed = 1): Result<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  const root = asObject(parsed.value);
  if (!root) return err("Not a valid JSON Schema: the root must be a JSON object.");
  const invalid = validateSchemaRoot(root);
  if (invalid) return err(invalid);
  try {
    const sample = gen(root, root, mulberry32(seed), 0);
    return ok(JSON.stringify(sample, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not generate sample: ${message}`);
  }
}
