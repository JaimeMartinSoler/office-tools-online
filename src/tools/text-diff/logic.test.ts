import { describe, expect, it } from "vitest";
import { computeDiff, diffChars } from "./logic";

describe("diffChars", () => {
  it("marks only the changed characters", () => {
    const { left, right } = diffChars("color", "colour");
    expect(left.map((s) => s.text).join("")).toBe("color");
    expect(right.map((s) => s.text).join("")).toBe("colour");
    // The inserted "u" is the only insert segment on the right.
    const inserts = right.filter((s) => s.type === "insert");
    expect(inserts.map((s) => s.text).join("")).toBe("u");
    expect(left.filter((s) => s.type === "delete")).toHaveLength(0);
  });

  it("handles full replacement", () => {
    const { left, right } = diffChars("abc", "xyz");
    expect(left.every((s) => s.type === "delete")).toBe(true);
    expect(right.every((s) => s.type === "insert")).toBe(true);
  });
});

describe("computeDiff (text)", () => {
  it("reports identical inputs", () => {
    const result = computeDiff("a\nb", "a\nb", "text");
    expect(result.ok && result.value.identical).toBe(true);
    expect(result.ok && result.value.rows.every((r) => r.type === "equal")).toBe(
      true,
    );
  });

  it("detects an inserted line", () => {
    const result = computeDiff("a\nc", "a\nb\nc", "text");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.additions).toBe(1);
    expect(result.value.deletions).toBe(0);
    const inserted = result.value.rows.find((r) => r.type === "insert");
    expect(inserted?.right?.segments.map((s) => s.text).join("")).toBe("b");
  });

  it("detects a deleted line", () => {
    const result = computeDiff("a\nb\nc", "a\nc", "text");
    expect(result.ok && result.value.deletions).toBe(1);
    expect(result.ok && result.value.additions).toBe(0);
  });

  it("aligns a changed line into a modify row with inline diff", () => {
    const result = computeDiff("hello world", "hello there", "text");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const modify = result.value.rows.find((r) => r.type === "modify");
    expect(modify).toBeDefined();
    expect(modify?.left?.segments.some((s) => s.type === "delete")).toBe(true);
    expect(modify?.right?.segments.some((s) => s.type === "insert")).toBe(true);
  });
});

describe("computeDiff (json)", () => {
  it("ignores key order and formatting", () => {
    const a = '{"b":2,"a":1}';
    const b = '{ "a": 1, "b": 2 }';
    const result = computeDiff(a, b, "json");
    expect(result.ok && result.value.identical).toBe(true);
  });

  it("surfaces value differences", () => {
    const a = '{"a":1}';
    const b = '{"a":2}';
    const result = computeDiff(a, b, "json");
    expect(result.ok && result.value.identical).toBe(false);
    expect(result.ok && result.value.rows.some((r) => r.type === "modify")).toBe(
      true,
    );
  });

  it("errors on invalid JSON", () => {
    expect(computeDiff("{bad}", "{}", "json").ok).toBe(false);
    expect(computeDiff("{}", "nope", "json").ok).toBe(false);
  });
});
