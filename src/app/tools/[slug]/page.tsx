import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toolMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getTool, tools } from "@/tools/registry";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Enumerate every tool route at build time (required for static export).
export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return toolMetadata(tool);
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const toolUrl = `${SITE_URL}/tools/${tool.slug}/`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: tool.name,
        description: tool.description,
        url: toolUrl,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript.",
        isAccessibleForFree: true,
        keywords: tool.keywords.join(", "),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: tool.name,
            item: toolUrl,
          },
        ],
      },
    ],
  };

  const ToolComponent = tool.Component;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolComponent />
    </>
  );
}
