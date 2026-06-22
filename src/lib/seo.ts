import type { Metadata } from "next";
import type { Tool } from "@/tools/registry";
import { SITE_NAME } from "./site";

/**
 * Shared SEO/metadata helpers.
 *
 * Keep every search-facing string derivation here so the page <title>, meta
 * description, social-card (Open Graph / Twitter) previews, and the JSON-LD
 * keywords all stay consistent and registry-driven — never hardcode a tool's
 * title or description in a page component.
 */

/** Brand logo, reused as the default Open Graph / Twitter preview image. */
export const OG_IMAGE = {
  url: "/icon.png",
  width: 256,
  height: 256,
  alt: SITE_NAME,
} as const;

/**
 * The document <title> for a tool. Prefers the search-optimised `seoTitle`
 * (phrased the way people actually search) and falls back to the display name.
 */
export function toolTitle(tool: Tool): string {
  return tool.seoTitle ?? tool.name;
}

/**
 * Meta description for a tool — the registry description plus the privacy-first
 * positioning that differentiates this site in search results.
 */
export function toolDescription(tool: Tool): string {
  return `${tool.description} Free and private — runs entirely in your browser, your data is never uploaded.`;
}

/**
 * Full per-tool metadata: title, description, keywords, canonical, and the
 * Open Graph + Twitter cards that render a rich preview when a tool link is
 * shared or surfaced by a search engine.
 */
export function toolMetadata(tool: Tool): Metadata {
  const title = toolTitle(tool);
  const description = toolDescription(tool);
  const url = `/tools/${tool.slug}/`;
  const socialTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description,
    },
  };
}
