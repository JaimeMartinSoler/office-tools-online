import type { ComponentType } from "react";
import type { ToolHeaderProps } from "@/components/tool-layout";
import { CLIPBOARD_SHARING_URL } from "@/lib/site";
import type { ToolContent } from "@/lib/tool-content";
import { Base64Tool } from "./base64";
import { ColorConverterTool } from "./color-converter";
import { CronExpressionTool } from "./cron-expression";
import { HashGeneratorTool } from "./hash-generator";
import { JsonJsonSchema } from "./json-json-schema";
import { JsonYamlXml } from "./json-yaml-xml";
import { JwtInspectorTool } from "./jwt-inspector";
import { MarkdownTool } from "./markdown";
import { NumberBaseConverterTool } from "./number-base-converter";
import { PasswordGeneratorTool } from "./password-generator";
import { StringCaseConverter } from "./string-case-converter";
import { TextDiffTool } from "./text-diff";
import { UnixTimestampTool } from "./unix-timestamp";
import { UrlTool } from "./url";
import { UuidUlidGeneratorTool } from "./uuid-ulid-generator";
import { content as base64Content } from "./base64/content";
import { content as colorConverterContent } from "./color-converter/content";
import { content as cronExpressionContent } from "./cron-expression/content";
import { content as hashGeneratorContent } from "./hash-generator/content";
import { content as jsonJsonSchemaContent } from "./json-json-schema/content";
import { content as jsonYamlXmlContent } from "./json-yaml-xml/content";
import { content as jwtInspectorContent } from "./jwt-inspector/content";
import { content as markdownContent } from "./markdown/content";
import { content as numberBaseConverterContent } from "./number-base-converter/content";
import { content as passwordGeneratorContent } from "./password-generator/content";
import { content as stringCaseConverterContent } from "./string-case-converter/content";
import { content as textDiffContent } from "./text-diff/content";
import { content as unixTimestampContent } from "./unix-timestamp/content";
import { content as urlContent } from "./url/content";
import { content as uuidUlidGeneratorContent } from "./uuid-ulid-generator/content";

export type ToolCategory = "JSON" | "Encoding" | "Text" | "Datetime" | "Misc";

interface MenuEntryBase {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
}

/** An on-site tool, rendered at /tools/<slug>. */
export interface Tool extends MenuEntryBase {
  /**
   * Search-optimised page <title>, phrased the way people actually search
   * (e.g. "JSON Formatter & Converter") when the display `name` is not a good
   * match. Falls back to `name` when omitted. Keep it short enough that
   * `toolDocumentTitle` stays within `TITLE_MAX` (src/lib/seo.ts).
   */
  seoTitle?: string;
  /**
   * On-page <h1>, phrased as a human would type it. Resolves
   * `h1 ?? seoTitle ?? name` (`toolHeading`); set it only when the `seoTitle`
   * reads badly as a heading. Sidebar and command palette keep the short `name`.
   */
  h1?: string;
  status?: "stable" | "placeholder";
  /**
   * Below-the-fold reference copy (what it does, steps, examples, FAQ, related
   * tools), kept in the tool's co-located `content.ts`. Rendered by
   * `ToolArticle` and reused, verbatim, for the FAQPage/HowTo JSON-LD. Every
   * `stable` tool must have it (registry.test.ts).
   */
  content?: ToolContent;
  /**
   * Receives the resolved heading and the registry `description` from
   * /tools/[slug]/page.tsx and forwards them to `ToolLayout` — tool components
   * can't import this registry (circular), so they never hardcode their header.
   */
  Component: ComponentType<ToolHeaderProps>;
}

/** A menu entry that links out to another site (opened in a new tab). */
export interface ExternalTool extends MenuEntryBase {
  url: string;
}

export type MenuEntry = Tool | ExternalTool;

/**
 * Single source of truth for every on-site tool.
 *
 * The static params for /tools/[slug], the sitemap, and — together with
 * `externalTools` — the sidebar, command palette, and homepage grid are ALL
 * derived from this array. Never hardcode a tool list anywhere else (see
 * docs/ARCHITECTURE.md).
 */
export const tools: Tool[] = [
  {
    slug: "json-yaml-xml",
    name: "JSON ↔ YAML ↔ XML ↔ CSV",
    seoTitle: "JSON Formatter & Converter (YAML, XML, CSV)",
    h1: "JSON Formatter and Converter",
    description:
      "Format, beautify, and minify JSON, and convert between JSON, YAML, XML, and CSV in any direction.",
    category: "JSON",
    keywords: [
      "json",
      "yaml",
      "xml",
      "csv",
      "convert",
      "transform",
      "beautify",
      "minify",
      "format",
      "pretty",
      "validate",
    ],
    status: "stable",
    content: jsonYamlXmlContent,
    Component: JsonYamlXml,
  },
  {
    slug: "json-json-schema",
    name: "JSON ↔ JSON Schema",
    seoTitle: "JSON Schema Generator & Validator",
    description:
      "Infer a JSON Schema (draft 2020-12) from a sample JSON document, or generate sample data from a schema.",
    category: "JSON",
    keywords: [
      "json",
      "schema",
      "infer",
      "draft",
      "2020-12",
      "sample",
      "mock",
      "generate",
    ],
    status: "stable",
    content: jsonJsonSchemaContent,
    Component: JsonJsonSchema,
  },
  {
    slug: "base64",
    name: "Base64",
    seoTitle: "Base64 Encoder & Decoder",
    description:
      "Encode and decode Base64 and URL-safe Base64URL text, or encode any file to Base64. Unicode-safe.",
    category: "Encoding",
    keywords: ["base64", "base64url", "encode", "decode", "url-safe"],
    status: "stable",
    content: base64Content,
    Component: Base64Tool,
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    seoTitle: "Hash Generator — MD5, SHA-256, BLAKE3, Argon2",
    h1: "Hash Generator (MD5, SHA-256, BLAKE3, Argon2)",
    description:
      "Generate hashes, HMACs, and derived keys — MD5, SHA-1/2/3, BLAKE2b, BLAKE3, CRC32, bcrypt, Argon2.",
    category: "Encoding",
    keywords: [
      "hash",
      "md5",
      "sha",
      "sha256",
      "sha512",
      "sha3",
      "ripemd",
      "crc32",
      "blake2",
      "blake3",
      "hmac",
      "checksum",
      "digest",
      "pbkdf2",
      "scrypt",
      "bcrypt",
      "argon2",
      "salt",
      "kdf",
    ],
    status: "stable",
    content: hashGeneratorContent,
    Component: HashGeneratorTool,
  },
  {
    slug: "url",
    name: "URL Encoder / Decoder",
    seoTitle: "URL Encoder & Decoder Online",
    h1: "URL Encoder, Decoder & Query Parser",
    description:
      "Percent-encode or decode text and URLs, and parse a URL's query string into key/value pairs.",
    category: "Encoding",
    keywords: [
      "url",
      "uri",
      "encode",
      "decode",
      "percent",
      "escape",
      "unescape",
      "query",
      "querystring",
      "parameters",
      "params",
    ],
    status: "stable",
    content: urlContent,
    Component: UrlTool,
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    seoTitle: "Random Password Generator",
    description:
      "Generate strong random passwords with the Web Crypto API — choose length, character sets, and minimums.",
    category: "Encoding",
    keywords: [
      "password",
      "generator",
      "random",
      "secure",
      "strong",
      "passphrase",
      "lowercase",
      "uppercase",
      "digits",
      "symbols",
      "special",
      "entropy",
    ],
    status: "stable",
    content: passwordGeneratorContent,
    Component: PasswordGeneratorTool,
  },
  {
    slug: "jwt-inspector",
    name: "JWT Inspector",
    seoTitle: "JWT Decoder & Verifier",
    description:
      "Decode a JWT's header and payload, inspect claims and expiry, and verify HS256/384/512 signatures.",
    category: "Encoding",
    keywords: [
      "jwt",
      "json web token",
      "decode",
      "claims",
      "header",
      "payload",
      "hs256",
      "hs384",
      "hs512",
      "hmac",
      "verify",
      "expiry",
      "bearer",
      "auth",
    ],
    status: "stable",
    content: jwtInspectorContent,
    Component: JwtInspectorTool,
  },
  {
    slug: "uuid-ulid-generator",
    name: "UUID / ULID Generator",
    seoTitle: "UUID & ULID Generator (v4, v7)",
    h1: "UUID & ULID Generator",
    description:
      "Generate UUID v4, UUID v7, and ULID identifiers in bulk (up to 1,000 at once) with the Web Crypto API.",
    category: "Encoding",
    keywords: [
      "uuid",
      "ulid",
      "guid",
      "v4",
      "v7",
      "uuidv4",
      "uuidv7",
      "generate",
      "random",
      "identifier",
      "id",
      "bulk",
    ],
    status: "stable",
    content: uuidUlidGeneratorContent,
    Component: UuidUlidGeneratorTool,
  },
  {
    slug: "number-base-converter",
    name: "Number Base Converter",
    seoTitle: "Number Base Converter (Hex, Binary, Octal)",
    description:
      "Convert integers between binary, octal, decimal, and hexadecimal, with a bit-by-bit view of the value.",
    category: "Encoding",
    keywords: [
      "number",
      "base",
      "radix",
      "binary",
      "octal",
      "decimal",
      "hexadecimal",
      "hex",
      "bin",
      "oct",
      "dec",
      "bitwise",
      "bits",
      "convert",
    ],
    status: "stable",
    content: numberBaseConverterContent,
    Component: NumberBaseConverterTool,
  },
  {
    slug: "markdown",
    name: "Markdown",
    seoTitle: "Markdown Converter — HTML & CSV to Markdown",
    h1: "HTML & CSV to Markdown Converter",
    description:
      "Convert HTML or CSV tables to clean Markdown, or write Markdown and preview it rendered as HTML.",
    category: "Text",
    keywords: [
      "markdown",
      "md",
      "html",
      "csv",
      "table",
      "convert",
      "to markdown",
    ],
    status: "stable",
    content: markdownContent,
    Component: MarkdownTool,
  },
  {
    slug: "string-case-converter",
    name: "String Case Converter",
    seoTitle: "Case Converter — camelCase, snake_case & more",
    h1: "Case Converter (camelCase, snake_case & more)",
    description:
      "Convert text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, and more.",
    category: "Text",
    keywords: [
      "case",
      "camel",
      "pascal",
      "snake",
      "kebab",
      "constant",
      "title",
      "convert",
    ],
    status: "stable",
    content: stringCaseConverterContent,
    Component: StringCaseConverter,
  },
  {
    slug: "text-diff",
    name: "Text / JSON Diff",
    seoTitle: "Text & JSON Diff Checker — Compare Online",
    h1: "Text & JSON Diff Checker",
    description:
      "Compare two texts side by side with line and character-level highlighting, or diff JSON structurally.",
    category: "Text",
    keywords: [
      "diff",
      "compare",
      "difference",
      "text",
      "json",
      "side by side",
      "unified",
      "merge",
      "changes",
      "character",
      "line",
    ],
    status: "stable",
    content: textDiffContent,
    Component: TextDiffTool,
  },
  {
    slug: "unix-timestamp",
    name: "Unix Timestamp Converter",
    seoTitle: "Unix Timestamp Converter — Epoch to Date",
    h1: "Unix Timestamp Converter (Epoch to Date)",
    description:
      "Convert Unix epoch timestamps in seconds or milliseconds to readable dates, and dates back to timestamps.",
    category: "Datetime",
    keywords: [
      "unix",
      "timestamp",
      "epoch",
      "date",
      "time",
      "seconds",
      "milliseconds",
      "iso 8601",
      "convert",
    ],
    status: "stable",
    content: unixTimestampContent,
    Component: UnixTimestampTool,
  },
  {
    slug: "cron-expression",
    name: "Cron Expression Explainer",
    seoTitle: "Cron Expression Explainer & Crontab Parser",
    description:
      "Explain a cron expression field by field in plain English, with its periodicity and matched values.",
    category: "Datetime",
    keywords: [
      "cron",
      "crontab",
      "schedule",
      "expression",
      "quartz",
      "minute",
      "hour",
      "day",
      "month",
      "weekday",
      "periodicity",
      "explain",
    ],
    status: "stable",
    content: cronExpressionContent,
    Component: CronExpressionTool,
  },
  {
    slug: "color-converter",
    name: "Color Converter",
    seoTitle: "Color Converter & WCAG Contrast Checker",
    description:
      "Convert colors between HEX, RGB, HSL, and OKLCH, and check the WCAG contrast ratio of two colors.",
    category: "Misc",
    keywords: [
      "color",
      "colour",
      "hex",
      "rgb",
      "hsl",
      "oklch",
      "convert",
      "contrast",
      "wcag",
      "accessibility",
      "a11y",
      "palette",
      "picker",
    ],
    status: "stable",
    content: colorConverterContent,
    Component: ColorConverterTool,
  },
];

/**
 * Menu entries that live on another site. They appear in the sidebar, command
 * palette, and homepage grid alongside `tools`, but open `url` in a new tab
 * and have no /tools/[slug] page, sitemap entry, or SEO metadata here.
 */
export const externalTools: ExternalTool[] = [
  {
    slug: "clipboard-sharing",
    name: "Clipboard Sharing",
    description:
      "Share text between your devices, end-to-end encrypted in the browser.",
    category: "Misc",
    keywords: ["clipboard", "share", "sync", "paste", "devices", "encrypted"],
    url: CLIPBOARD_SHARING_URL,
  },
];

/** Every menu entry: on-site tools first, then external ones. */
export const menuEntries: MenuEntry[] = [...tools, ...externalTools];

export function isExternalTool(entry: MenuEntry): entry is ExternalTool {
  return "url" in entry;
}

export const toolCategories: ToolCategory[] = [
  "JSON",
  "Encoding",
  "Text",
  "Datetime",
  "Misc",
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

/**
 * A menu entry reduced to plain, serialisable data. The sidebar and command
 * palette are client components, so they receive these as props from the
 * server layout instead of importing this registry — which would bundle every
 * tool's `content` prose into the client JS of every page.
 */
export interface MenuLink {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  href: string;
  external: boolean;
  placeholder: boolean;
}

export interface MenuLinkGroup {
  category: ToolCategory;
  links: MenuLink[];
}

function menuLink(entry: MenuEntry): MenuLink {
  const external = isExternalTool(entry);
  return {
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    keywords: entry.keywords,
    href: external ? entry.url : `/tools/${entry.slug}`,
    external,
    placeholder: !external && entry.status === "placeholder",
  };
}

/** Every menu entry as plain data, in `menuEntries` order (command palette). */
export function menuLinks(): MenuLink[] {
  return menuEntries.map(menuLink);
}

/** Menu entries as plain data, grouped like `toolsByCategory` (sidebar). */
export function menuLinkGroups(): MenuLinkGroup[] {
  return toolsByCategory().map((group) => ({
    category: group.category,
    links: group.tools.map(menuLink),
  }));
}

export function toolsByCategory(): Array<{
  category: ToolCategory;
  tools: MenuEntry[];
}> {
  return toolCategories
    .map((category) => ({
      category,
      tools: menuEntries.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.tools.length > 0);
}
