import { afterEach, describe, expect, it, vi } from "vitest";

// SITE_INDEXABLE is resolved when src/lib/site.ts is first imported, so each
// case stubs GITHUB_REF_NAME and re-imports the module graph.
async function robotsFor(refName: string | undefined) {
  vi.resetModules();
  vi.stubEnv("GITHUB_REF_NAME", refName);
  const { default: robots } = await import("./robots");
  return robots();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots.txt", () => {
  it("allows crawling and advertises the sitemap on the main build", async () => {
    const result = await robotsFor("main");
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe("https://office-dev-tools.com/sitemap.xml");
  });

  it("blocks everything and omits the sitemap on non-production builds", async () => {
    for (const ref of ["develop", undefined]) {
      const result = await robotsFor(ref);
      expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
      expect(result.sitemap).toBeUndefined();
    }
  });
});
