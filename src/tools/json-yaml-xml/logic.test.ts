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

const FLAT = { nested: false, inferTypes: false };
const NESTED = { nested: true, inferTypes: false };

function csvValue(
  input: string,
  from: Parameters<typeof convertData>[1],
  to: Parameters<typeof convertData>[2],
  csv: Parameters<typeof convertData>[5],
) {
  const result = convertData(input, from, to, 2, true, csv);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe("convertData — value → CSV", () => {
  it("converts an array of flat objects with a header row", () => {
    const out = csvValue('[{"a":1,"b":2},{"a":3,"b":4}]', "json", "csv", FLAT);
    expect(out).toBe("a,b\n1,2\n3,4");
  });

  it("unions keys across rows, filling gaps with empty cells", () => {
    const out = csvValue('[{"a":1},{"b":2}]', "json", "csv", FLAT);
    expect(out).toBe("a,b\n1,\n,2");
  });

  it("treats a single object as one row", () => {
    const out = csvValue('{"a":1,"b":2}', "json", "csv", FLAT);
    expect(out).toBe("a,b\n1,2");
  });

  it("errors on a nested field when nesting is off", () => {
    const out = convertData('{"id":1,"a":{"b":1}}', "json", "csv", 2, true, FLAT);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toContain('Field "a" is nested');
  });

  it("flattens nested objects into dotted columns when nesting is on", () => {
    const out = csvValue('{"id":1,"a":{"b":2,"c":3}}', "json", "csv", NESTED);
    expect(out).toBe("id,a.b,a.c\n1,2,3");
  });

  it("joins scalar arrays with commas when nesting is on", () => {
    const out = csvValue('{"id":1,"tags":["x","y"]}', "json", "csv", NESTED);
    expect(out).toBe('id,tags\n1,"x,y"');
  });

  it("embeds a list of objects as a JSON string when nesting is on", () => {
    const out = csvValue('{"name":"x","items":[{"a":1}]}', "json", "csv", NESTED);
    expect(out).toBe('name,items\nx,"[{""a"":1}]"');
  });

  it("escapes commas, quotes, and newlines per RFC 4180", () => {
    const out = csvValue('{"a":"x,y","b":"say \\"hi\\""}', "json", "csv", FLAT);
    expect(out).toBe('a,b\n"x,y","say ""hi"""');
  });

  it("unwraps an XML-style list into rows", () => {
    const xml = "<people><person><n>Ada</n></person><person><n>Bob</n></person></people>";
    const out = csvValue(xml, "xml", "csv", FLAT);
    expect(out).toBe("n\nAda\nBob");
  });
});

describe("convertData — CSV → value", () => {
  it("parses CSV into an array of objects (strings by default)", () => {
    const out = csvValue("a,b\n1,2\n3,4", "csv", "json", FLAT);
    expect(JSON.parse(out)).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("handles quoted fields with embedded commas and quotes", () => {
    const out = csvValue('a,b\n"x,y","say ""hi"""', "csv", "json", FLAT);
    expect(JSON.parse(out)).toEqual([{ a: "x,y", b: 'say "hi"' }]);
  });

  it("infers number/boolean/null when value typing is on", () => {
    const out = csvValue("a,b,c\n1,true,", "csv", "json", {
      nested: false,
      inferTypes: true,
    });
    expect(JSON.parse(out)).toEqual([{ a: 1, b: true, c: null }]);
  });

  it("rebuilds nested objects from dotted headers when nesting is on", () => {
    const out = csvValue("a.b,a.c\n1,2", "csv", "json", NESTED);
    expect(JSON.parse(out)).toEqual([{ a: { b: "1", c: "2" } }]);
  });

  it("skips blank lines and tolerates a trailing newline", () => {
    const out = csvValue("a\n1\n\n2\n", "csv", "json", FLAT);
    expect(JSON.parse(out)).toEqual([{ a: "1" }, { a: "2" }]);
  });

  it("reports empty CSV input", () => {
    expect(convertData("   ", "csv", "json").ok).toBe(false);
  });
});
