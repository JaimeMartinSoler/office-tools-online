import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CSP_CONNECT_SRC, isIndexableDeploy } from "./site";

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

describe("CSP_CONNECT_SRC", () => {
  it("quotes public/_headers' live connect-src exactly (the homepage claims it)", () => {
    const headers = readFileSync(
      fileURLToPath(new URL("../../public/_headers", import.meta.url)),
      "utf8",
    );
    const directive = headers.match(/connect-src ([^;]+);/)?.[1];
    expect(directive).toBe(CSP_CONNECT_SRC);
  });
});
