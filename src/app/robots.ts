import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required for metadata routes under `output: "export"` — emits a static file
// at build time instead of a server route.
export const dynamic = "force-static";

// Emitted as a static out/robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
