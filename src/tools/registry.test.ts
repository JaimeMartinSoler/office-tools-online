import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contentLinks } from "@/lib/tool-content";
import { categories, categoryInfo } from "./categories";
import {
  externalTools,
  isExternalTool,
  menuEntries,
  tools,
  toolsByCategory,
} from "./registry";

describe("registry menu entries", () => {
  it("lists every on-site tool and every external entry exactly once", () => {
    expect(menuEntries).toHaveLength(tools.length + externalTools.length);
    const slugs = menuEntries.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("tells external entries apart from on-site tools", () => {
    expect(tools.some(isExternalTool)).toBe(false);
    expect(externalTools.every(isExternalTool)).toBe(true);
  });

  it("points every external entry at an absolute https URL", () => {
    for (const entry of externalTools) {
      expect(new URL(entry.url).protocol).toBe("https:");
    }
  });

  it("links Clipboard Sharing out to the sibling site instead of a route", () => {
    const clipboard = menuEntries.find((e) => e.slug === "clipboard-sharing");
    expect(clipboard && isExternalTool(clipboard)).toBe(true);
    expect(clipboard && isExternalTool(clipboard) && clipboard.url).toBe(
      "https://clipboard-sharing-online.com",
    );
    expect(tools.some((tool) => tool.slug === "clipboard-sharing")).toBe(false);
  });

  it("groups external entries into their category for the menus", () => {
    const grouped = toolsByCategory().flatMap((group) => group.tools);
    expect(grouped).toHaveLength(menuEntries.length);
    for (const entry of externalTools) expect(grouped).toContain(entry);
  });
});

describe("tool page content", () => {
  const stable = tools.filter((tool) => tool.status === "stable");

  it("gives every stable tool content with examples and at least four FAQ entries", () => {
    expect(stable.length).toBeGreaterThan(0);
    for (const tool of stable) {
      const { content } = tool;
      expect(content, tool.slug).toBeDefined();
      expect(content!.examples.length, tool.slug).toBeGreaterThanOrEqual(1);
      expect(content!.faq.length, tool.slug).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps each section within the intended size", () => {
    for (const tool of tools) {
      const { content } = tool;
      if (!content) continue;
      expect(content.steps.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(content.steps.length, tool.slug).toBeLessThanOrEqual(5);
      expect(content.examples.length, tool.slug).toBeLessThanOrEqual(4);
      expect(content.faq.length, tool.slug).toBeLessThanOrEqual(6);
      for (const example of content.examples) {
        expect(example.input.trim(), `${tool.slug}: ${example.title}`).not.toBe("");
        expect(example.output.trim(), `${tool.slug}: ${example.title}`).not.toBe("");
      }
    }
  });

  it("never repeats an FAQ question across tools", () => {
    const questions = tools.flatMap((tool) => tool.content?.faq.map((f) => f.question) ?? []);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("links related tools in the body text, and only to real pages", () => {
    const pages = new Set([
      "/privacy/",
      "/about/",
      ...tools.map((tool) => `/tools/${tool.slug}/`),
      ...categories.map((info) => `/tools/${info.slug}/`),
    ]);
    for (const tool of tools) {
      if (!tool.content) continue;
      for (const href of contentLinks(tool.content)) {
        expect(pages, `${tool.slug} -> ${href}`).toContain(href);
      }
      // "Related tools" must link 2-3 other tools, never the page itself.
      const related = contentLinks({
        ...tool.content,
        intro: "",
        steps: [],
        examples: [],
        faq: [],
      });
      expect(related.length, tool.slug).toBeGreaterThanOrEqual(2);
      expect(related.length, tool.slug).toBeLessThanOrEqual(3);
      expect(related, tool.slug).not.toContain(`/tools/${tool.slug}/`);
    }
  });
});

describe("category hubs", () => {
  it("has hub copy for every category that has tools", () => {
    for (const group of toolsByCategory()) {
      expect(categoryInfo[group.category].category).toBe(group.category);
    }
  });

  it("uses hub slugs that can't collide with a tool route", () => {
    const toolSlugs = new Set(tools.map((tool) => tool.slug));
    const hubSlugs = categories.map((info) => info.slug);
    expect(new Set(hubSlugs).size).toBe(hubSlugs.length);
    for (const slug of hubSlugs) {
      expect(toolSlugs.has(slug), slug).toBe(false);
      expect(slug).toMatch(/^[a-z]+$/);
    }
  });
});

describe("client bundle hygiene", () => {
  it("no client component imports registry values (only `import type`)", () => {
    const srcDir = fileURLToPath(new URL("../", import.meta.url));
    const files = (readdirSync(srcDir, { recursive: true }) as string[])
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => ({ file, source: readFileSync(`${srcDir}${file}`, "utf8") }))
      .filter(({ source }) => /^["']use client["'];/m.test(source));
    expect(files.length).toBeGreaterThan(0);
    for (const { file, source } of files) {
      // Importing the registry from a client component would bundle every
      // tool's `content` prose into the JS of every page.
      expect(source, file).not.toMatch(/^import\s+(?!type\b)[^;]*from\s+["']@\/tools\/registry["']/m);
    }
  });
});
