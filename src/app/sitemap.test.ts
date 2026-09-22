import { describe, expect, it } from "vitest";
import { tools } from "@/tools/registry";
import sitemap from "./sitemap";

describe("sitemap.xml", () => {
  it("lists the static pages and every tool, with trailing slashes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toHaveLength(3 + tools.length);
    for (const url of urls) expect(url.endsWith("/")).toBe(true);
  });

  it("does not claim every URL changed on each build", () => {
    for (const entry of sitemap()) expect(entry.lastModified).toBeUndefined();
  });
});
