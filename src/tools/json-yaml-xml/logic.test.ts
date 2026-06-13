import { describe, expect, it } from "vitest";
import { convertData, isJsonObjectOrArray } from "./logic";

function value(input: string, from: Parameters<typeof convertData>[1], to: Parameters<typeof convertData>[2], indent?: Parameters<typeof convertData>[3]) {
  const result = convertData(input, from, to, indent);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe("convertData — cross-format", () => {
  it("json → yaml", () => {
    const out = value('{"a":1,"b":[1,2]}', "json", "yaml");
    expect(out).toContain("a: 1");
    expect(out).toContain("- 1");
  });

  it("yaml → json", () => {
    const out = value("a: 1\nb:\n  - 1\n  - 2\n", "yaml", "json");
    expect(JSON.parse(out)).toEqual({ a: 1, b: [1, 2] });
  });

  it("json → xml uses the single root key", () => {
    const out = value('{"note":{"to":"Ada","from":"Bob"}}', "json", "xml");
    expect(out).toContain("<note>");
    expect(out).toContain("<to>Ada</to>");
    expect(out).not.toContain("<root>");
  });

  it("json → xml auto-wraps multi-key objects in <root>", () => {
    const out = value('{"a":1,"b":2}', "json", "xml");
    expect(out).toContain("<root>");
    expect(out).toContain("<a>1</a>");
  });

  it("xml → json", () => {
    const out = value("<note><to>Ada</to></note>", "xml", "json");
    expect(JSON.parse(out)).toEqual({ note: { to: "Ada" } });
  });

  it("xml → yaml", () => {
    const out = value("<note><to>Ada</to></note>", "xml", "yaml");
    expect(out).toContain("to: Ada");
  });

  it("yaml → xml", () => {
    const out = value("note:\n  to: Ada\n", "yaml", "xml");
    expect(out).toContain("<note>");
    expect(out).toContain("<to>Ada</to>");
  });
});

describe("convertData — same format reformats", () => {
  it("json → json beautifies", () => {
    expect(value('{"a":1,"b":2}', "json", "json")).toBe(
      '{\n  "a": 1,\n  "b": 2\n}',
    );
  });
});

describe("convertData — minify (pretty=false)", () => {
  it("json → json collapses to a single line", () => {
    const out = convertData('{\n  "a": 1,\n  "b": 2\n}', "json", "json", 2, false);
    expect(out.ok && out.value).toBe('{"a":1,"b":2}');
  });

  it("xml → xml has no newlines", () => {
    const out = convertData("<note><to>Ada</to></note>", "xml", "xml", 2, false);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.value).not.toContain("\n");
  });
});

describe("isJsonObjectOrArray", () => {
  it("is true for JSON objects and arrays", () => {
    expect(isJsonObjectOrArray('{"a":1}')).toBe(true);
    expect(isJsonObjectOrArray("[1,2]")).toBe(true);
  });

  it("is false for YAML, scalars, and invalid input", () => {
    expect(isJsonObjectOrArray("a: 1")).toBe(false);
    expect(isJsonObjectOrArray("42")).toBe(false);
    expect(isJsonObjectOrArray("null")).toBe(false);
    expect(isJsonObjectOrArray('"x"')).toBe(false);
    expect(isJsonObjectOrArray("")).toBe(false);
    expect(isJsonObjectOrArray("{bad}")).toBe(false);
  });
});

describe("convertData — XML attributes", () => {
  it("round-trips attributes via the @_ prefix", () => {
    const parsed = value('<user id="7"><name>Ada</name></user>', "xml", "json");
    expect(JSON.parse(parsed).user["@_id"]).toBe("7");
    const back = value(parsed, "json", "xml");
    expect(back).toContain('id="7"');
  });
});

describe("convertData — indentation", () => {
  it("applies tab indent to JSON", () => {
    expect(value('{"a":1}', "json", "json", "tab")).toBe('{\n\t"a": 1\n}');
  });

  it("applies 4-space indent to JSON", () => {
    expect(value('{"a":1}', "json", "json", 4)).toBe('{\n    "a": 1\n}');
  });
});

describe("convertData — errors", () => {
  it("reports invalid JSON", () => {
    expect(convertData("{bad}", "json", "yaml").ok).toBe(false);
  });

  it("reports invalid YAML", () => {
    expect(convertData("foo: [1, 2", "yaml", "json").ok).toBe(false);
  });

  it("reports invalid XML", () => {
    expect(convertData("<a><b></a>", "xml", "json").ok).toBe(false);
  });

  it("reports empty input", () => {
    expect(convertData("   ", "json", "yaml")).toEqual({
      ok: false,
      error: "Input is empty.",
    });
  });
});
