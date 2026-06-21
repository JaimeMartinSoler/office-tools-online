import type { ComponentType } from "react";
import { Base64Tool } from "./base64";
import { ClipboardSharing } from "./clipboard-sharing";
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

export type ToolCategory = "JSON" | "Encoding" | "Text" | "Datetime" | "Misc";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  status?: "stable" | "placeholder";
  Component: ComponentType;
}

/**
 * Single source of truth for every tool.
 *
 * The sidebar, command palette, homepage grid, and the static params for
 * /tools/[slug] are ALL derived from this array — never hardcode a tool list
 * anywhere else (see docs/ARCHITECTURE.md).
 */
export const tools: Tool[] = [
  {
    slug: "json-yaml-xml",
    name: "JSON ↔ YAML ↔ XML ↔ CSV",
    description:
      "Convert, beautify, and minify between JSON, YAML, XML, and CSV.",
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
    Component: JsonYamlXml,
  },
  {
    slug: "json-json-schema",
    name: "JSON ↔ JSON Schema",
    description:
      "Infer a JSON Schema from a sample, or generate a sample from a schema.",
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
    Component: JsonJsonSchema,
  },
  {
    slug: "base64",
    name: "Base64",
    description: "Encode and decode Base64 and Base64URL.",
    category: "Encoding",
    keywords: ["base64", "base64url", "encode", "decode", "url-safe"],
    status: "stable",
    Component: Base64Tool,
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    description:
      "Generate hashes, HMACs, and derived keys — MD5, SHA, BLAKE, PBKDF2, bcrypt, Argon2.",
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
    Component: HashGeneratorTool,
  },
  {
    slug: "url",
    name: "URL Encoder / Decoder",
    description:
      "Percent-encode or decode text, and parse a URL's query string into key/value pairs.",
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
    Component: UrlTool,
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    description:
      "Generate strong random passwords — choose length, character sets, and minimums. Runs entirely in your browser.",
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
    Component: PasswordGeneratorTool,
  },
  {
    slug: "jwt-inspector",
    name: "JWT Inspector",
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
    Component: JwtInspectorTool,
  },
  {
    slug: "uuid-ulid-generator",
    name: "UUID / ULID Generator",
    description:
      "Generate UUID v4, UUID v7, and ULID identifiers in bulk, using the Web Crypto API.",
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
    Component: UuidUlidGeneratorTool,
  },
  {
    slug: "number-base-converter",
    name: "Number Base Converter",
    description:
      "Convert integers between binary, octal, decimal, and hexadecimal, with a bit-by-bit view.",
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
    Component: NumberBaseConverterTool,
  },
  {
    slug: "markdown",
    name: "Markdown",
    description: "Convert HTML or CSV into Markdown.",
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
    Component: MarkdownTool,
  },
  {
    slug: "string-case-converter",
    name: "String Case Converter",
    description: "Convert text between common naming cases.",
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
    Component: StringCaseConverter,
  },
  {
    slug: "text-diff",
    name: "Text / JSON Diff",
    description:
      "Compare two texts side by side with line and character-level highlighting, including structural JSON diff.",
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
    Component: TextDiffTool,
  },
  {
    slug: "unix-timestamp",
    name: "Unix Timestamp Converter",
    description:
      "Convert Unix timestamps to dates and back, in seconds or milliseconds.",
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
    Component: UnixTimestampTool,
  },
  {
    slug: "cron-expression",
    name: "Cron Expression Explainer",
    description:
      "Explain a cron expression field by field, with the periodicity and matched values.",
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
    Component: CronExpressionTool,
  },
  {
    slug: "color-converter",
    name: "Color Converter",
    description:
      "Convert colours between hex, rgb, hsl, and oklch, and check WCAG contrast ratios.",
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
    Component: ColorConverterTool,
  },
  {
    slug: "clipboard-sharing",
    name: "Clipboard Sharing",
    description: "Share clipboard contents across devices. (Coming soon)",
    category: "Misc",
    keywords: ["clipboard", "share", "sync", "paste"],
    status: "placeholder",
    Component: ClipboardSharing,
  },
];

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

export function toolsByCategory(): Array<{ category: ToolCategory; tools: Tool[] }> {
  return toolCategories
    .map((category) => ({
      category,
      tools: tools.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.tools.length > 0);
}
