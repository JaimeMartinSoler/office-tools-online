import { describe, expect, it } from "vitest";
import { schemaToSample } from "./logic";

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
});
