import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));

/**
 * The opening `<Tag …>` of every occurrence of `tag` in `source`, scanning
 * brace depth so `>` inside `{…}` expressions (e.g. arrow functions) doesn't
 * end the tag early.
 */
function openingTags(source: string, tag: string): string[] {
  const tags: string[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf(`<${tag}`, from);
    if (start === -1) return tags;
    let depth = 0;
    let end = start;
    for (; end < source.length; end++) {
      const ch = source[end];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) break;
    }
    tags.push(source.slice(start, end + 1));
    from = end;
  }
}

const components = readdirSync(toolsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    slug: entry.name,
    source: readFileSync(`${toolsDir}${entry.name}/index.tsx`, "utf8"),
  }));

describe("tool component headers", () => {
  it("finds every tool component", () => {
    expect(components.length).toBeGreaterThan(0);
  });

  // The on-page <h1> and blurb come from the registry via /tools/[slug]/page.tsx
  // (`toolHeading` + `description`). A hardcoded string here would silently
  // reintroduce a second, drifting copy of the registry's copy.
  it.each(components)("$slug forwards the registry header instead of hardcoding it", ({ source }) => {
    const tags = [
      ...openingTags(source, "ToolLayout"),
      ...openingTags(source, "ConverterTool"),
    ];
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      expect(tag).toContain("title={title}");
      expect(tag).toContain("description={description}");
      expect(tag).not.toMatch(/\b(title|description)=["'{]\s*["'`]/);
    }
  });
});
