import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  return {
    title: tool.name,
    // Meta-only suffix: lengthens the description and reinforces the
    // privacy-first positioning without changing on-page content.
    description: `${tool.description} Runs entirely in your browser — your data is never uploaded.`,
    alternates: { canonical: `/tools/${slug}/` },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/tools/${tool.slug}/`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
