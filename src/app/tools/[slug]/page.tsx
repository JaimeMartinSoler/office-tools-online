import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryHub } from "@/components/category-hub";
import { ToolArticle } from "@/components/tool-article";
import { categoryMetadata, toolHeading, toolMetadata } from "@/lib/seo";
import { jsonLdScriptContent, toolStructuredData } from "@/lib/structured-data";
import {
  categories,
  categoryInfo,
  categoryPath,
  getCategoryBySlug,
} from "@/tools/categories";
import { getTool, tools } from "@/tools/registry";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Enumerate every tool route, plus the /tools/<category>/ hubs, at build time
// (required for static export). Both share this one dynamic segment; slugs
// can't collide (registry.test.ts).
export function generateStaticParams() {
  return [
    ...tools.map((tool) => ({ slug: tool.slug })),
    ...categories.map((info) => ({ slug: info.slug })),
  ];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (tool) return toolMetadata(tool);
  const category = getCategoryBySlug(slug);
  if (category) return categoryMetadata(category);
  return {};
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) {
    const category = getCategoryBySlug(slug);
    if (!category) notFound();
    return <CategoryHub info={category} />;
  }

  const ToolComponent = tool.Component;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(toolStructuredData(tool)) }}
      />
      <ToolComponent title={toolHeading(tool)} description={tool.description} />
      {tool.content && (
        <ToolArticle
          content={tool.content}
          category={{
            heading: categoryInfo[tool.category].heading,
            href: categoryPath(tool.category),
          }}
        />
      )}
    </>
  );
}
