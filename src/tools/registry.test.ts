import { describe, expect, it } from "vitest";
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
