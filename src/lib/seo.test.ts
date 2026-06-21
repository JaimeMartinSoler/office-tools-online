import { describe, expect, it } from "vitest";
import { tools } from "@/tools/registry";
import { toolDescription, toolMetadata, toolTitle } from "./seo";

const jsonTool = tools.find((t) => t.slug === "json-yaml-xml")!;
const passwordTool = tools.find((t) => t.slug === "password-generator")!;

describe("toolTitle", () => {
  it("prefers the search-optimised seoTitle when present", () => {
    expect(jsonTool.seoTitle).toBeTruthy();
    expect(toolTitle(jsonTool)).toBe(jsonTool.seoTitle);
  });

  it("falls back to the display name when no seoTitle is set", () => {
    expect(passwordTool.seoTitle).toBeUndefined();
    expect(toolTitle(passwordTool)).toBe(passwordTool.name);
  });
});

describe("toolDescription", () => {
  it("appends the privacy-first positioning to the registry description", () => {
    const description = toolDescription(jsonTool);
    expect(description.startsWith(jsonTool.description)).toBe(true);
    expect(description).toMatch(/entirely in your browser/i);
  });
});

describe("toolMetadata", () => {
  it("builds title, description, keywords, and canonical from the tool", () => {
    const meta = toolMetadata(jsonTool);
    expect(meta.title).toBe(toolTitle(jsonTool));
    expect(meta.description).toBe(toolDescription(jsonTool));
    expect(meta.keywords).toEqual(jsonTool.keywords);
    expect(meta.alternates?.canonical).toBe("/tools/json-yaml-xml/");
  });

  it("emits Open Graph and Twitter cards with a branded, absolute-ready url", () => {
    const meta = toolMetadata(jsonTool);
    expect(meta.openGraph?.url).toBe("/tools/json-yaml-xml/");
    expect(meta.openGraph?.title).toContain("Office Dev Tools");
    expect(meta.openGraph).toHaveProperty("images");
    expect(meta.twitter?.card).toBe("summary");
  });
});

describe("registry SEO invariants", () => {
  it("every non-placeholder tool has keywords and a reasonable title length", () => {
    for (const tool of tools) {
      if (tool.status === "placeholder") continue;
      expect(tool.keywords.length).toBeGreaterThan(0);
      // Keep titles short enough to avoid SERP truncation once the
      // " — Office Dev Tools" template suffix is appended.
      expect(toolTitle(tool).length).toBeLessThanOrEqual(50);
    }
  });
});
