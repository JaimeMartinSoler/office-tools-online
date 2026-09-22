import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";

// Required for metadata routes under `output: "export"` — emits a static file
// at build time instead of a server route.
export const dynamic = "force-static";

// Emitted as a static out/robots.txt. Only the production (`main`) build
// allows crawling and advertises the sitemap; staging and local builds block
// everything so they never compete with the canonical origin (see
// `isIndexableDeploy`).
export default function robots(): MetadataRoute.Robots {
  if (!SITE_INDEXABLE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
