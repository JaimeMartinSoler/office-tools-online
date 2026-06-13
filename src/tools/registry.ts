import type { ComponentType } from "react";
import { Base64Tool } from "./base64";
import { ClipboardSharing } from "./clipboard-sharing";
import { JsonJsonSchema } from "./json-json-schema";
import { JsonYamlXml } from "./json-yaml-xml";
import { MarkdownTool } from "./markdown";
import { StringCaseConverter } from "./string-case-converter";

export type ToolCategory = "JSON" | "Encoding" | "Text" | "Misc";

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
    name: "JSON ↔ YAML ↔ XML",
    description: "Convert, beautify, and minify between JSON, YAML, and XML.",
    category: "JSON",
    keywords: [
      "json",
      "yaml",
      "xml",
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
    slug: "clipboard-sharing",
    name: "Clipboard Sharing",
    description: "Share clipboard contents across devices. (Coming soon)",
    category: "Misc",
    keywords: ["clipboard", "share", "sync", "paste"],
    status: "placeholder",
    Component: ClipboardSharing,
  },
];

export const toolCategories: ToolCategory[] = ["JSON", "Encoding", "Text", "Misc"];

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
