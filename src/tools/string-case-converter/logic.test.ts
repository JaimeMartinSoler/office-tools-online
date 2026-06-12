import { describe, expect, it } from "vitest";
import { allCases, convert, convertCase, splitWords } from "./logic";

describe("splitWords", () => {
  it("splits separators and camelCase", () => {
    expect(splitWords("hello world-example")).toEqual([
      "hello",
      "world",
      "example",
    ]);
    expect(splitWords("fooBarBaz")).toEqual(["foo", "Bar", "Baz"]);
  });

  it("splits acronym boundaries", () => {
    expect(splitWords("parseJSONString")).toEqual(["parse", "JSON", "String"]);
  });
});

describe("convertCase", () => {
  const input = "hello world-example";
  it("camelCase", () => expect(convertCase(input, "camel")).toBe("helloWorldExample"));
  it("PascalCase", () =>
    expect(convertCase(input, "pascal")).toBe("HelloWorldExample"));
  it("snake_case", () =>
    expect(convertCase(input, "snake")).toBe("hello_world_example"));
  it("kebab-case", () =>
    expect(convertCase(input, "kebab")).toBe("hello-world-example"));
  it("CONSTANT_CASE", () =>
    expect(convertCase(input, "constant")).toBe("HELLO_WORLD_EXAMPLE"));
  it("Title Case", () =>
    expect(convertCase(input, "title")).toBe("Hello World Example"));
  it("Sentence case", () =>
    expect(convertCase(input, "sentence")).toBe("Hello world example"));
  it("lower/upper preserve separators", () => {
    expect(convertCase("Hello-World", "lower")).toBe("hello-world");
    expect(convertCase("Hello-World", "upper")).toBe("HELLO-WORLD");
  });
  it("handles empty input", () => {
    expect(convertCase("", "camel")).toBe("");
  });
});

describe("convert per-line", () => {
  it("converts each line independently", () => {
    expect(convert("foo bar\nbaz qux", "snake", true)).toBe("foo_bar\nbaz_qux");
  });
  it("treats input as one when per-line is off", () => {
    expect(convert("foo bar\nbaz", "snake", false)).toBe("foo_bar_baz");
  });
});

describe("allCases", () => {
  it("returns every variant", () => {
    const results = allCases("hello world", false);
    expect(results).toHaveLength(9);
    expect(results.find((r) => r.id === "snake")?.value).toBe("hello_world");
  });
});
