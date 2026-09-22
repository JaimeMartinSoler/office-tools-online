import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { tools, type Tool } from "@/tools/registry";
import {
  DEFAULT_TITLE,
  DESCRIPTION_MAX,
  DESCRIPTION_SUFFIX,
  OG_IMAGE,
  TITLE_MAX,
  TITLE_SUFFIX,
  TITLE_TEMPLATE,
  toolDescription,
  toolDocumentTitle,
  toolHeading,
  toolMetadata,
  toolTitle,
} from "./seo";

const jsonTool = tools.find((t) => t.slug === "json-yaml-xml")!;
const base64Tool = tools.find((t) => t.slug === "base64")!;

/** A copy of a real tool with some fields overridden, for fallback cases. */
function variant(overrides: Partial<Tool>): Tool {
  return { ...base64Tool, seoTitle: undefined, h1: undefined, ...overrides };
}

const fromRoot = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url));

describe("toolTitle", () => {
  it("prefers the search-optimised seoTitle when present", () => {
    expect(jsonTool.seoTitle).toBeTruthy();
    expect(toolTitle(jsonTool)).toBe(jsonTool.seoTitle);
  });

  it("falls back to the display name when no seoTitle is set", () => {
    expect(toolTitle(variant({}))).toBe(base64Tool.name);
  });
});

describe("toolDocumentTitle", () => {
  it("appends the brand suffix when it fits within TITLE_MAX", () => {
    const tool = variant({ seoTitle: "Base64 Encoder & Decoder" });
    expect(toolDocumentTitle(tool)).toBe(
      "Base64 Encoder & Decoder · Office Dev Tools",
    );
  });

  it("drops the brand suffix rather than overflow TITLE_MAX", () => {
    const seoTitle = "x".repeat(TITLE_MAX - TITLE_SUFFIX.length + 1);
    expect(toolDocumentTitle(variant({ seoTitle }))).toBe(seoTitle);
  });

  it("keeps the suffix at exactly TITLE_MAX", () => {
    const seoTitle = "x".repeat(TITLE_MAX - TITLE_SUFFIX.length);
    expect(toolDocumentTitle(variant({ seoTitle }))).toHaveLength(TITLE_MAX);
  });
});

describe("toolHeading", () => {
  it("resolves h1, then seoTitle, then name", () => {
    expect(toolHeading(variant({ h1: "H", seoTitle: "S" }))).toBe("H");
    expect(toolHeading(variant({ seoTitle: "S" }))).toBe("S");
    expect(toolHeading(variant({}))).toBe(base64Tool.name);
  });
});

describe("toolDescription", () => {
  it("appends the privacy-first positioning to the registry description", () => {
    const description = toolDescription(jsonTool);
    expect(description.startsWith(jsonTool.description)).toBe(true);
    expect(description.endsWith(DESCRIPTION_SUFFIX)).toBe(true);
    expect(description).toMatch(/in your browser/i);
  });
});

describe("toolMetadata", () => {
  it("builds title, description, keywords, and canonical from the tool", () => {
    const meta = toolMetadata(jsonTool);
    // `absolute` bypasses the root layout's template.
    expect(meta.title).toEqual({ absolute: toolDocumentTitle(jsonTool) });
    expect(meta.description).toBe(toolDescription(jsonTool));
    expect(meta.keywords).toEqual(jsonTool.keywords);
    expect(meta.alternates?.canonical).toBe("/tools/json-yaml-xml/");
  });

  it("emits Open Graph and large-image Twitter cards that both carry the OG image", () => {
    const meta = toolMetadata(jsonTool);
    expect(meta.openGraph?.url).toBe("/tools/json-yaml-xml/");
    expect(meta.openGraph?.title).toContain("Office Dev Tools");
    expect(meta.openGraph?.images).toEqual([OG_IMAGE]);
    // Next replaces the layout's `twitter` wholesale, so the tool page must
    // declare its own image or the card ships without one.
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [OG_IMAGE.url],
    });
  });
});

describe("site-wide title config", () => {
  it("uses a %s template so per-page titles are not discarded", () => {
    expect(TITLE_TEMPLATE).toContain("%s");
    // …and the root layout actually uses it.
    const layout = readFileSync(fromRoot("src/app/layout.tsx"), "utf8");
    expect(layout).toMatch(/template:\s*TITLE_TEMPLATE/);
    expect(layout).toMatch(/default:\s*DEFAULT_TITLE/);
  });

  it("keeps the default (homepage) title within TITLE_MAX", () => {
    expect(DEFAULT_TITLE.length).toBeLessThanOrEqual(TITLE_MAX);
  });
});

describe("OG image", () => {
  it("exists in public/ with the declared 1200x630 dimensions", () => {
    const png = readFileSync(fromRoot(`public${OG_IMAGE.url}`));
    // PNG signature, then the IHDR chunk: width and height are big-endian
    // uint32s at byte offsets 16 and 20.
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect(png.readUInt32BE(16)).toBe(OG_IMAGE.width);
    expect(png.readUInt32BE(20)).toBe(OG_IMAGE.height);
    expect([OG_IMAGE.width, OG_IMAGE.height]).toEqual([1200, 630]);
  });
});

/** Lower-cased word trigrams, ignoring punctuation. */
function trigrams(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.slice(0, -2).map((w, i) => `${w} ${words[i + 1]} ${words[i + 2]}`);
}

describe("registry SEO invariants", () => {
  it("every tool has keywords and a seoTitle", () => {
    for (const tool of tools) {
      expect(tool.keywords.length, tool.slug).toBeGreaterThan(0);
      expect(tool.seoTitle, tool.slug).toBeTruthy();
    }
  });

  it("every composed <title> fits within TITLE_MAX", () => {
    for (const tool of tools) {
      expect(toolDocumentTitle(tool).length, tool.slug).toBeLessThanOrEqual(
        TITLE_MAX,
      );
    }
  });

  it("every composed <title> is unique", () => {
    const titles = tools.map(toolDocumentTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("every composed meta description fits a search snippet", () => {
    for (const tool of tools) {
      const { length } = toolDescription(tool);
      expect(length, tool.slug).toBeLessThanOrEqual(DESCRIPTION_MAX);
      // Guard against thin descriptions too.
      expect(length, tool.slug).toBeGreaterThanOrEqual(120);
    }
  });

  it("every composed meta description is unique", () => {
    const descriptions = tools.map(toolDescription);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("no registry description repeats a phrase from the appended suffix", () => {
    const suffixPhrases = trigrams(DESCRIPTION_SUFFIX);
    for (const tool of tools) {
      const own = trigrams(tool.description);
      for (const phrase of suffixPhrases) {
        expect(own, `${tool.slug}: "${phrase}"`).not.toContain(phrase);
      }
    }
  });
});
