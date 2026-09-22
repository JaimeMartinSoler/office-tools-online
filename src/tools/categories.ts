import type { ToolCategory } from "./registry";

/**
 * Copy and routing for the /tools/<category>/ hub pages. Kept out of
 * registry.ts (which is already long) but keyed by the registry's
 * `ToolCategory`, so adding a category without hub copy fails type-checking.
 * The list of tools on each hub still comes from the registry (`menuEntries`).
 */
export interface CategoryInfo {
  category: ToolCategory;
  /** URL segment: /tools/<slug>/. Must not collide with a tool slug. */
  slug: string;
  /** Search-facing <title> (brand suffix added when it fits TITLE_MAX). */
  seoTitle: string;
  /** On-page <h1>. */
  heading: string;
  /** Meta description, ≤ DESCRIPTION_MAX including the shared suffix. */
  description: string;
  /** A paragraph of genuine intro copy about the category. */
  intro: string;
}

export const categoryInfo: Record<ToolCategory, CategoryInfo> = {
  JSON: {
    category: "JSON",
    slug: "json",
    seoTitle: "JSON Tools — Format, Convert & Infer Schemas",
    heading: "JSON Tools",
    description:
      "JSON tools: format and minify JSON, convert it to YAML, XML, or CSV, and infer a JSON Schema from a sample.",
    intro:
      "JSON is the format most APIs, config files, and logs end up in, so most debugging starts by making it readable. These tools cover the jobs that come up around it: pretty-printing a minified response, turning a document into YAML for a config file or into CSV for a spreadsheet, reading XML from an older system as JSON, and writing down the shape of a payload as a JSON Schema — or going the other way and producing a sample document from a schema you already have.",
  },
  Encoding: {
    category: "Encoding",
    slug: "encoding",
    seoTitle: "Encoding, Hashing & ID Tools",
    heading: "Encoding, Hashing & Identifier Tools",
    description:
      "Encode Base64 and URLs, hash with SHA-256, BLAKE3, bcrypt, or Argon2, decode JWTs, and generate UUIDs.",
    intro:
      "This group covers the byte-level chores of web development. Encoding tools (Base64, percent-encoding, number bases) change how data is written without hiding it; the hash generator produces one-way digests and slow password hashes; the JWT inspector decodes the Base64URL segments of a token and checks HMAC signatures; and the password and UUID/ULID generators draw their randomness from the Web Crypto API. None of them is encryption — where that distinction matters, each tool's FAQ says so.",
  },
  Text: {
    category: "Text",
    slug: "text",
    seoTitle: "Text Tools — Diff, Case Converter & Markdown",
    heading: "Text Tools",
    description:
      "Diff text or JSON, convert camelCase to snake_case and back, and turn HTML or CSV into Markdown.",
    intro:
      "Text tools for the small edits that are tedious by hand. Compare two versions of a file line by line with character-level highlights (or compare two JSON documents while ignoring key order), rename an identifier across camelCase, snake_case, kebab-case and six other conventions at once, and convert HTML snippets or CSV exports into Markdown you can paste into a README, wiki, or pull request.",
  },
  Datetime: {
    category: "Datetime",
    slug: "datetime",
    seoTitle: "Date & Time Tools — Unix Timestamps & Cron",
    heading: "Date & Time Tools",
    description:
      "Convert Unix epoch timestamps to readable dates and back, and explain cron schedules field by field.",
    intro:
      "Two tools for the moments when time is written for machines. The Unix timestamp converter reads epoch values in seconds or milliseconds and shows the same instant in UTC, your local time zone, ISO 8601, and relative terms. The cron explainer takes a five-field crontab schedule and spells out, field by field, which minutes, hours, days, and months it matches.",
  },
  Misc: {
    category: "Misc",
    slug: "misc",
    seoTitle: "Color Converter & Other Utilities",
    heading: "Other Utilities",
    description:
      "Convert colors between HEX, RGB, HSL, and OKLCH, check WCAG contrast, and share text between devices.",
    intro:
      "Utilities that don't fit the other groups. The color converter moves a color between HEX, RGB, HSL, and OKLCH notation and grades the contrast of a text/background pair against WCAG AA and AAA. Clipboard Sharing lives on our sibling site and sends text between your own devices, end-to-end encrypted in the browser.",
  },
};

export const categories: CategoryInfo[] = Object.values(categoryInfo);

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return categories.find((info) => info.slug === slug);
}

export function categoryPath(category: ToolCategory): string {
  return `/tools/${categoryInfo[category].slug}/`;
}
