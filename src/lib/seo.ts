import type { Metadata } from "next";
import type { CategoryInfo } from "@/tools/categories";
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

/**
 * Longest <title> Google reliably shows without truncating. Every composed
 * title (site default, tool pages) must fit — seo.test.ts enforces it.
 */
export const TITLE_MAX = 60;

/** Brand suffix appended to page titles when it fits within `TITLE_MAX`. */
export const TITLE_SUFFIX = ` · ${SITE_NAME}`;

/**
 * Root-layout title template for simple pages (/about, /privacy). Tool pages
 * bypass it with `title.absolute` so they can drop the suffix when it would
 * overflow `TITLE_MAX` — see `toolDocumentTitle`.
 */
export const TITLE_TEMPLATE = `%s${TITLE_SUFFIX}`;

/** Homepage / fallback <title> and social-card title. */
export const DEFAULT_TITLE = `${SITE_NAME} — private, client-side dev utilities`;

/**
 * Longest meta description Google reliably shows in a snippet. Every composed
 * tool description must fit — seo.test.ts enforces it.
 */
export const DESCRIPTION_MAX = 160;

/**
 * Privacy-first positioning appended to every tool's meta description. Kept
 * short so registry descriptions have room to say what the tool does; registry
 * descriptions must not repeat any of it (seo.test.ts enforces that too).
 */
export const DESCRIPTION_SUFFIX =
  " Free and private — runs in your browser, no uploads.";

/** Branded social-card image (Open Graph + Twitter `summary_large_image`). */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — private, client-side dev tools`,
} as const;

/**
 * A tool's search-facing title. Prefers the search-optimised `seoTitle`
 * (phrased the way people actually search) and falls back to the display name.
 */
export function toolTitle(tool: Tool): string {
  return tool.seoTitle ?? tool.name;
}

/**
 * The document <title> for a tool page: `toolTitle` plus the brand suffix, but
 * only when the result stays within `TITLE_MAX` — otherwise the bare tool title,
 * since the keyword-rich part matters more than the brand in a truncated SERP.
 */
export function toolDocumentTitle(tool: Tool): string {
  return brandedTitle(toolTitle(tool));
}

/** `title` plus the brand suffix when that still fits within `TITLE_MAX`. */
function brandedTitle(title: string): string {
  const branded = `${title}${TITLE_SUFFIX}`;
  return branded.length <= TITLE_MAX ? branded : title;
}

/**
 * The on-page <h1> for a tool: an explicit `h1`, else the `seoTitle`, else the
 * display name. The sidebar and command palette keep using the short `name`.
 */
export function toolHeading(tool: Tool): string {
  return tool.h1 ?? tool.seoTitle ?? tool.name;
}

/**
 * Meta description for a tool — the registry description plus the privacy-first
 * positioning that differentiates this site in search results.
 */
export function toolDescription(tool: Tool): string {
  return `${tool.description}${DESCRIPTION_SUFFIX}`;
}

/**
 * Full per-tool metadata: title, description, keywords, canonical, and the
 * Open Graph + Twitter cards that render a rich preview when a tool link is
 * shared or surfaced by a search engine.
 *
 * The Twitter object is set in full (card + images) because Next replaces a
 * parent's `twitter` wholesale rather than merging into the layout's.
 */
export function toolMetadata(tool: Tool): Metadata {
  return {
    ...pageMetadata({
      title: toolTitle(tool),
      documentTitle: toolDocumentTitle(tool),
      description: toolDescription(tool),
      url: `/tools/${tool.slug}/`,
    }),
    keywords: tool.keywords,
  };
}

/** The document <title> for a /tools/<category>/ hub page. */
export function categoryDocumentTitle(info: CategoryInfo): string {
  return brandedTitle(info.seoTitle);
}

/** Meta description for a category hub, with the same privacy suffix as tools. */
export function categoryDescription(info: CategoryInfo): string {
  return `${info.description}${DESCRIPTION_SUFFIX}`;
}

/** Full metadata for a /tools/<category>/ hub page. */
export function categoryMetadata(info: CategoryInfo): Metadata {
  return pageMetadata({
    title: info.seoTitle,
    documentTitle: categoryDocumentTitle(info),
    description: categoryDescription(info),
    url: `/tools/${info.slug}/`,
  });
}

function pageMetadata({
  title,
  documentTitle,
  description,
  url,
}: {
  title: string;
  documentTitle: string;
  description: string;
  url: string;
}): Metadata {
  const socialTitle = `${title} — ${SITE_NAME}`;

  return {
    // `absolute` bypasses the root layout's `%s · Office Dev Tools` template:
    // brandedTitle already decided whether the suffix fits.
    title: { absolute: documentTitle },
    description,
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
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
