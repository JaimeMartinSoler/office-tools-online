import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { tools } from "@/tools/registry";

// Emitted as a static out/sitemap.xml under `output: "export"`. URLs carry
// trailing slashes to match the deployed routes (`trailingSlash: true`).
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/privacy/"];
  const toolPaths = tools.map((tool) => `/tools/${tool.slug}/`);

  return [...staticPaths, ...toolPaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
