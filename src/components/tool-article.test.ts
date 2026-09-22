import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { toolStructuredData } from "@/lib/structured-data";
import { categoryInfo, categoryPath } from "@/tools/categories";
import { tools, type Tool } from "@/tools/registry";
import { ToolArticle } from "./tool-article";

const withContent = tools.filter(
  (tool): tool is Tool & { content: NonNullable<Tool["content"]> } => !!tool.content,
);

function render(tool: (typeof withContent)[number]): string {
  return renderToStaticMarkup(
    createElement(ToolArticle, {
      content: tool.content,
      category: {
        heading: categoryInfo[tool.category].heading,
        href: categoryPath(tool.category),
      },
    }),
  );
}

/** Visible text of an HTML fragment: tags stripped, entities decoded. */
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** The rendered FAQ as [question, answer] pairs. */
function renderedFaq(html: string): Array<[string, string]> {
  return [...html.matchAll(/<div[^>]*data-faq-item[^>]*><h3[^>]*>(.*?)<\/h3><p>(.*?)<\/p><\/div>/g)].map(
    (m) => [text(m[1]!), text(m[2]!)],
  );
}

/** The rendered "How to use it" steps. */
function renderedSteps(html: string): string[] {
  const list = html.match(/How to use it<\/h2><ol[^>]*>(.*?)<\/ol>/)?.[1] ?? "";
  return [...list.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((m) => text(m[1]!));
}

type Node = Record<string, unknown>;
const node = (tool: Tool, type: string) =>
  (toolStructuredData(tool)["@graph"] as Node[]).find((n) => n["@type"] === type);

describe("ToolArticle ↔ JSON-LD", () => {
  it("covers every tool that has content", () => {
    expect(withContent.length).toBe(tools.length);
  });

  it.each(withContent.map((tool) => [tool.slug, tool] as const))(
    "%s: FAQPage entries match the rendered FAQ exactly",
    (_slug, tool) => {
      const faq = renderedFaq(render(tool));
      const jsonLd = (node(tool, "FAQPage")!.mainEntity as Node[]).map((q) => [
        q.name,
        (q.acceptedAnswer as Node).text,
      ]);
      expect(faq.length).toBe(tool.content.faq.length);
      expect(jsonLd).toEqual(faq);
    },
  );

  it.each(withContent.map((tool) => [tool.slug, tool] as const))(
    "%s: HowTo steps match the rendered steps exactly",
    (_slug, tool) => {
      const steps = renderedSteps(render(tool));
      const jsonLd = (node(tool, "HowTo")!.step as Node[]).map((s) => s.text);
      expect(steps.length).toBe(tool.content.steps.length);
      expect(jsonLd).toEqual(steps);
    },
  );

  it("keeps the WebApplication node and breadcrumbs Home → Category → Tool", () => {
    for (const tool of tools) {
      expect(node(tool, "WebApplication")).toBeDefined();
      const crumbs = (node(tool, "BreadcrumbList")!.itemListElement as Node[]).map((c) => c.item);
      expect(crumbs).toEqual([
        "https://office-dev-tools.com/",
        `https://office-dev-tools.com${categoryPath(tool.category)}`,
        `https://office-dev-tools.com/tools/${tool.slug}/`,
      ]);
    }
  });

  it("renders inline markup as real links and code, not raw markdown", () => {
    const html = render(withContent.find((tool) => tool.slug === "base64")!);
    expect(html).toContain('<a class="');
    // next/link applies `trailingSlash` from next.config only in the real build.
    expect(html).toMatch(/href="\/tools\/jwt-inspector\/?"/);
    expect(html).toMatch(/<code[^>]*>\+<\/code>/);
    expect(text(html)).not.toMatch(/\]\(|`|\*\*/);
  });
});
