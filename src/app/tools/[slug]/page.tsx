import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    description: tool.description,
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const ToolComponent = tool.Component;
  return <ToolComponent />;
}
