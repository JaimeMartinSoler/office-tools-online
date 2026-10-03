import { describe, expect, it } from "vitest";
import {
  editorBoxHeight,
  SIZE_VERTICAL_L,
  SIZE_VERTICAL_M,
  SIZE_VERTICAL_S,
  SIZE_VERTICAL_XL,
  SIZE_VERTICAL_XS,
} from "./sizes";

describe("editor sizes", () => {
  it("defines the five line counts, largest first", () => {
    expect([
      SIZE_VERTICAL_XL,
      SIZE_VERTICAL_L,
      SIZE_VERTICAL_M,
      SIZE_VERTICAL_S,
      SIZE_VERTICAL_XS,
    ]).toEqual([40, 30, 20, 10, 1]);
  });

  it("derives the box height from the line count", () => {
    expect(editorBoxHeight(SIZE_VERTICAL_M)).toBe("calc(20 * 1.225rem + 10px)");
    expect(editorBoxHeight(SIZE_VERTICAL_XS)).toBe("calc(1 * 1.225rem + 10px)");
  });
});
