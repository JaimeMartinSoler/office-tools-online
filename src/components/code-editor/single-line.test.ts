import { describe, expect, it } from "vitest";
import { toSingleLine } from "./single-line";

describe("toSingleLine", () => {
  it("leaves single-line text untouched", () => {
    expect(toSingleLine("*/5 * * * *")).toBe("*/5 * * * *");
    expect(toSingleLine("")).toBe("");
  });

  it("turns each line break into one space", () => {
    expect(toSingleLine("0 9\n* * 1-5")).toBe("0 9 * * 1-5");
    expect(toSingleLine("a\r\nb\rc")).toBe("a b c");
  });

  it("collapses whitespace around a break, including blank lines", () => {
    expect(toSingleLine("a  \n\n   b")).toBe("a b");
  });

  it("keeps leading and trailing breaks as a space", () => {
    expect(toSingleLine("\n1700000000\n")).toBe(" 1700000000 ");
  });
});
