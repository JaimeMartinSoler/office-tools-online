import { describe, expect, it } from "vitest";
import { yamlToJson } from "./logic";

describe("yamlToJson", () => {
  it("converts mappings and sequences", () => {
    const result = yamlToJson("a: 1\nb:\n  - 1\n  - 2\n");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.value)).toEqual({ a: 1, b: [1, 2] });
    }
  });

  it("respects indent option", () => {
    const result = yamlToJson("a: 1", "tab");
    expect(result.ok && result.value).toBe('{\n\t"a": 1\n}');
  });

  it("preserves unicode", () => {
    const result = yamlToJson('msg: "héllo 😀"');
    expect(result.ok && JSON.parse(result.value).msg).toBe("héllo 😀");
  });

  it("reports invalid YAML", () => {
    const result = yamlToJson("foo: [1, 2");
    expect(result.ok).toBe(false);
  });

  it("reports empty input", () => {
    expect(yamlToJson("   ")).toEqual({ ok: false, error: "Input is empty." });
  });
});
