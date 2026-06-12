import { parseJson } from "@/lib/json";
import { err, ok, type Result } from "@/lib/result";

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

function sampleString(node: Record<string, unknown>): string {
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
      const minLength = asNumber(node.minLength);
      let value = "string";
      if (minLength !== undefined) {
        while (value.length < minLength) value += "x";
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
      return sampleString(node);
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
  if (!root) return err("Schema must be a JSON object.");
  try {
    const sample = gen(root, root, mulberry32(seed), 0);
    return ok(JSON.stringify(sample, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not generate sample: ${message}`);
  }
}
