import { describe, expect, it } from "vitest";
import { isIndexableDeploy } from "./site";

describe("isIndexableDeploy", () => {
  it("indexes only the production (main) build", () => {
    expect(isIndexableDeploy("main")).toBe(true);
  });

  it("keeps staging, feature, and local builds out of search engines", () => {
    expect(isIndexableDeploy("develop")).toBe(false);
    expect(isIndexableDeploy("feature/some-branch")).toBe(false);
    // Local builds have no GITHUB_REF_NAME at all.
    expect(isIndexableDeploy(undefined)).toBe(false);
  });
});
