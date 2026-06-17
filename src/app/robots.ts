import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Emitted as a static out/robots.txt under `output: "export"`.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
