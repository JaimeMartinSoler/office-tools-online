import { describe, expect, it } from "vitest";
import { beautify, minify, parseJson, validate } from "./logic";

describe("beautify", () => {
  it("formats with 2-space indent by default", () => {
    const result = beautify('{"a":1,"b":[2,3]}');
    expect(result).toEqual({ ok: true, value: '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}' });
  });

  it("formats with 4-space indent", () => {
    const result = beautify('{"a":1}', 4);
    expect(result.ok && result.value).toBe('{\n    "a": 1\n}');
  });

  it("formats with tab indent", () => {
    const result = beautify('{"a":1}', "tab");
    expect(result.ok && result.value).toBe('{\n\t"a": 1\n}');
  });

  it("preserves unicode and emoji", () => {
    const input = '{"msg":"héllo 😀"}';
    const result = beautify(input, 2);
    expect(result.ok && result.value).toContain("héllo 😀");
  });

  it("handles large input", () => {
    const big = JSON.stringify(Array.from({ length: 5000 }, (_, i) => i));
    const result = beautify(big, 2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.split("\n").length).toBeGreaterThan(5000);
  });
});

describe("minify", () => {
  it("collapses to a single line", () => {
    const result = minify('{\n  "a": 1,\n  "b": 2\n}');
    expect(result.ok && result.value).toBe('{"a":1,"b":2}');
  });
});

describe("validate", () => {
  it("accepts valid JSON", () => {
    expect(validate('{"ok":true}')).toEqual({ ok: true, value: true });
  });

  it("rejects invalid JSON", () => {
    const result = validate("{bad}");
    expect(result.ok).toBe(false);
  });
});

describe("parseJson errors", () => {
  it("reports empty input", () => {
    expect(parseJson("   ")).toEqual({ ok: false, error: "Input is empty." });
  });

  it("includes line and column for syntax errors", () => {
    const result = parseJson('{\n  "a": 1,\n  "b" 2\n}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/line \d+, column \d+/);
    }
  });

  it("does not throw on malformed input", () => {
    expect(() => parseJson("not json")).not.toThrow();
  });
});
