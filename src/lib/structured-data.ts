import { categoryInfo, type CategoryInfo } from "@/tools/categories";
import { isExternalTool, menuEntries, type Tool } from "@/tools/registry";
import { toolHeading } from "./seo";
import { SITE_URL } from "./site";
import { inlineToPlainText } from "./tool-content";

/**
 * JSON-LD builders for the tool and category pages. The FAQPage and HowTo
 * nodes are derived from `Tool.content` — the same data `ToolArticle` renders —
 * so the structured data can never drift from, or claim more than, the page.
 */

type JsonLd = Record<string, unknown>;

const HOME_CRUMB = { name: "Home", item: `${SITE_URL}/` };

function breadcrumbs(trail: Array<{ name: string; item: string }>): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...crumb,
    })),
  };
}

export function categoryUrl(info: CategoryInfo): string {
  return `${SITE_URL}/tools/${info.slug}/`;
}

export function toolUrl(tool: Tool): string {
  return `${SITE_URL}/tools/${tool.slug}/`;
}

/** WebApplication + Home → Category → Tool breadcrumbs, plus HowTo/FAQPage from the content. */
export function toolStructuredData(tool: Tool): JsonLd {
  const url = toolUrl(tool);
  const category = categoryInfo[tool.category];
  const graph: JsonLd[] = [
    {
      "@type": "WebApplication",
      name: tool.name,
      description: tool.description,
      url,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript.",
      isAccessibleForFree: true,
      keywords: tool.keywords.join(", "),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    breadcrumbs([
      HOME_CRUMB,
      { name: category.heading, item: categoryUrl(category) },
      { name: tool.name, item: url },
    ]),
  ];

  const { content } = tool;
  if (content) {
    graph.push({
      "@type": "HowTo",
      name: `How to use the ${toolHeading(tool)}`,
      step: content.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        text: inlineToPlainText(step),
      })),
    });
    graph.push({
      "@type": "FAQPage",
      mainEntity: content.faq.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: inlineToPlainText(entry.answer) },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/** CollectionPage listing the category's on-site tools, plus Home → Category breadcrumbs. */
export function categoryStructuredData(info: CategoryInfo): JsonLd {
  const url = categoryUrl(info);
  const members = menuEntries.filter(
    (entry) => entry.category === info.category && !isExternalTool(entry),
  );
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: info.heading,
        description: info.description,
        url,
        hasPart: members.map((entry) => ({
          "@type": "WebApplication",
          name: entry.name,
          url: `${SITE_URL}/tools/${entry.slug}/`,
        })),
      },
      breadcrumbs([HOME_CRUMB, { name: info.heading, item: url }]),
    ],
  };
}

/**
 * Serialise JSON-LD for a `<script type="application/ld+json">`. `<` is
 * escaped so copy that mentions tags (e.g. `<root>`) can never close the
 * script element early.
 */
export function jsonLdScriptContent(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
