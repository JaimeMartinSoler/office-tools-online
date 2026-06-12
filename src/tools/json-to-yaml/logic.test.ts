import { describe, expect, it } from "vitest";
import { jsonToYaml } from "./logic";

describe("jsonToYaml", () => {
  it("converts objects and arrays", () => {
    const result = jsonToYaml('{"a":1,"b":[1,2]}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain("a: 1");
      expect(result.value).toContain("- 1");
      expect(result.value).toContain("- 2");
    }
  });

  it("preserves unicode", () => {
    const result = jsonToYaml('{"msg":"héllo 😀"}');
    expect(result.ok && result.value).toContain("héllo 😀");
  });

  it("reports invalid JSON", () => {
    const result = jsonToYaml("{bad}");
    expect(result.ok).toBe(false);
  });

  it("reports empty input", () => {
    expect(jsonToYaml("   ")).toEqual({ ok: false, error: "Input is empty." });
  });
});
