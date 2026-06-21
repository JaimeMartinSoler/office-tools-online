import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { tools } from "@/tools/registry";

// Required for metadata routes under `output: "export"` — emits a static file
// at build time instead of a server route.
export const dynamic = "force-static";

// Emitted as a static out/sitemap.xml. URLs carry trailing slashes to match the
// deployed routes (`trailingSlash: true`).
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/privacy/", "/about/"];
  const toolPaths = tools.map((tool) => `/tools/${tool.slug}/`);

  return [...staticPaths, ...toolPaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
