import { describe, expect, it } from "vitest";
import { categories } from "@/tools/categories";
import { tools } from "@/tools/registry";
import sitemap from "./sitemap";

describe("sitemap.xml", () => {
  it("lists the static pages, category hubs, and every tool, with trailing slashes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toHaveLength(3 + categories.length + tools.length);
    for (const info of categories) {
      expect(urls).toContain(`https://office-dev-tools.com/tools/${info.slug}/`);
    }
    for (const url of urls) expect(url.endsWith("/")).toBe(true);
  });

  it("does not claim every URL changed on each build", () => {
    for (const entry of sitemap()) expect(entry.lastModified).toBeUndefined();
  });
});
