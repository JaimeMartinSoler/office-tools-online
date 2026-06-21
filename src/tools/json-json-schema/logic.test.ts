import { describe, expect, it } from "vitest";
import { inferSchema, looksLikeJsonSchema, schemaToSample } from "./logic";

const OPTS = { requiredByDefault: false, inferEnums: false };

function parse(input: string, opts = OPTS) {
  const result = inferSchema(input, opts);
  if (!result.ok) throw new Error(result.error);
  return JSON.parse(result.value);
}

describe("inferSchema", () => {
  it("infers object property types", () => {
    const schema = parse('{"a":1,"b":"x","c":true,"d":1.5}');
    expect(schema.$schema).toContain("2020-12");
    expect(schema.type).toBe("object");
    expect(schema.properties.a.type).toBe("integer");
    expect(schema.properties.b.type).toBe("string");
    expect(schema.properties.c.type).toBe("boolean");
    expect(schema.properties.d.type).toBe("number");
    expect(schema.required).toBeUndefined();
  });

  it("adds required when requiredByDefault is on", () => {
    const schema = parse('{"a":1,"b":2}', {
      requiredByDefault: true,
      inferEnums: false,
    });
    expect(schema.required).toEqual(["a", "b"]);
  });

  it("infers array item types", () => {
    const schema = parse('{"nums":[1,2,3]}');
    expect(schema.properties.nums.type).toBe("array");
    expect(schema.properties.nums.items.type).toBe("integer");
  });

  it("emits enum for primitive arrays when enabled", () => {
    const schema = parse('["a","b","a"]', {
      requiredByDefault: false,
      inferEnums: true,
    });
    expect(schema.items.enum).toEqual(["a", "b"]);
  });

  it("handles nested objects", () => {
    const schema = parse('{"outer":{"inner":1}}');
    expect(schema.properties.outer.properties.inner.type).toBe("integer");
  });

  it("reports invalid JSON", () => {
    expect(inferSchema("{bad}", OPTS).ok).toBe(false);
  });
});

function sample(schema: string, seed = 1) {
  const result = schemaToSample(schema, seed);
  if (!result.ok) throw new Error(result.error);
  return JSON.parse(result.value);
}

describe("schemaToSample", () => {
  it("generates an object with typed properties", () => {
    const out = sample(
      '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"integer"}},"required":["name"]}',
    );
    expect(typeof out.name).toBe("string");
    expect(Number.isInteger(out.age)).toBe(true);
  });

  it("respects const and default", () => {
    expect(sample('{"const":42}')).toBe(42);
    expect(sample('{"type":"string","default":"hi"}')).toBe("hi");
  });

  it("picks an enum value", () => {
    const out = sample('{"enum":["a","b","c"]}');
    expect(["a", "b", "c"]).toContain(out);
  });

  it("is deterministic for a given seed", () => {
    const schema = '{"enum":["a","b","c","d","e"]}';
    expect(schemaToSample(schema, 7)).toEqual(schemaToSample(schema, 7));
  });

  it("generates arrays honouring minItems", () => {
    const out = sample(
      '{"type":"array","items":{"type":"integer"},"minItems":3}',
    );
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(3);
    expect(Number.isInteger(out[0])).toBe(true);
  });

  it("resolves local $ref", () => {
    const out = sample(
      '{"type":"object","properties":{"user":{"$ref":"#/$defs/U"}},"$defs":{"U":{"type":"object","properties":{"id":{"type":"integer"}}}}}',
    );
    expect(Number.isInteger(out.user.id)).toBe(true);
  });

  it("uses string format hints", () => {
    expect(sample('{"type":"string","format":"email"}')).toBe(
      "user@example.com",
    );
  });

  it("rejects a non-object schema", () => {
    expect(schemaToSample("123").ok).toBe(false);
  });

  it("rejects invalid JSON with an error", () => {
    expect(schemaToSample("{bad}").ok).toBe(false);
  });

  it("rejects plain JSON data that is not a schema", () => {
    const result = schemaToSample('{"id":1,"name":"Ada"}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Not a valid JSON Schema");
  });

  it("rejects an empty object (no schema keywords)", () => {
    expect(schemaToSample("{}").ok).toBe(false);
  });

  it("rejects an unknown type value", () => {
    const result = schemaToSample('{"type":"objct"}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('"type"');
  });

  it("still accepts a type-array schema", () => {
    expect(schemaToSample('{"type":["string","null"]}').ok).toBe(true);
  });

  it("never emits a number above a negative maximum", () => {
    // Regression: with only `maximum` set, a default min of 0 used to produce
    // values above a negative maximum (e.g. -10 for maximum -50).
    for (let seed = 1; seed <= 25; seed++) {
      const out = sample('{"type":"number","maximum":-50}', seed);
      expect(out).toBeLessThanOrEqual(-50);
    }
  });

  it("honours both number bounds", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const out = sample('{"type":"number","minimum":10,"maximum":20}', seed);
      expect(out).toBeGreaterThanOrEqual(10);
      expect(out).toBeLessThanOrEqual(20);
    }
  });
});

describe("looksLikeJsonSchema", () => {
  it("flags a document with $schema", () => {
    expect(
      looksLikeJsonSchema(
        '{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object"}',
      ),
    ).toBe(true);
  });

  it("flags a root type of a JSON-Schema type name", () => {
    expect(looksLikeJsonSchema('{"type":"object","properties":{}}')).toBe(true);
  });

  it("flags $defs / definitions", () => {
    expect(looksLikeJsonSchema('{"$defs":{"X":{"type":"string"}}}')).toBe(true);
  });

  it("flags properties whose values are subschemas", () => {
    expect(
      looksLikeJsonSchema('{"properties":{"id":{"type":"integer"}}}'),
    ).toBe(true);
  });

  it("does not flag plain JSON data", () => {
    expect(looksLikeJsonSchema('{"id":1,"name":"Ada","active":true}')).toBe(
      false,
    );
  });

  it("does not flag data with a non-schema type field", () => {
    expect(looksLikeJsonSchema('{"type":"premium","name":"Ada"}')).toBe(false);
  });

  it("does not flag invalid JSON", () => {
    expect(looksLikeJsonSchema("{bad}")).toBe(false);
  });
});
