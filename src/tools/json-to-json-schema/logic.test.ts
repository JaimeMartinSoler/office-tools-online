import { describe, expect, it } from "vitest";
import { inferSchema } from "./logic";

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
