/**
 * Canonical, deploy-time site identity.
 *
 * Single source of truth for the production origin and brand name, reused by
 * page metadata (canonical + metadataBase), the sitemap, robots.txt, and the
 * JSON-LD structured data. Keep this the ONLY place the absolute URL lives.
 */
export const SITE_URL = "https://office-dev-tools.com";
export const SITE_NAME = "Office Dev Tools";

/**
 * Whether the build being produced is the production deploy that search
 * engines should index. The Pages deploy workflow builds every target with the
 * same `pnpm build`; GitHub Actions' default `GITHUB_REF_NAME` env var names
 * the branch being built, and only `main` goes to production. Every other
 * build — the `develop` staging slot, ad-hoc `workflow_dispatch` builds, local
 * builds — ships a disallow-all robots.txt and a `noindex` robots meta instead.
 *
 * A static export has no request-time hostname, so this cannot tell the
 * production custom domain apart from its `<project>.pages.dev` mirror (both
 * serve the `main` build); keeping that mirror out of the index is a
 * Cloudflare-side concern. deploy.yml asserts the `main` build allows crawling.
 */
export function isIndexableDeploy(refName: string | undefined): boolean {
  return refName === "main";
}

/** Resolved at build time (static export): true only for the `main` deploy. */
export const SITE_INDEXABLE = isIndexableDeploy(process.env.GITHUB_REF_NAME);

/** Sibling site — linked from the tool menus (external entry) and /about. */
export const CLIPBOARD_SHARING_URL = "https://clipboard-sharing-online.com";
