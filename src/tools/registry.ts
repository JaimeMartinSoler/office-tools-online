import type { ComponentType } from "react";
import { Base64Tool } from "./base64";
import { ClipboardSharing } from "./clipboard-sharing";
import { JsonFormatter } from "./json-formatter";
import { JsonSchemaToJson } from "./json-schema-to-json";
import { JsonToJsonSchema } from "./json-to-json-schema";
import { JsonToYaml } from "./json-to-yaml";
import { StringCaseConverter } from "./string-case-converter";
import { YamlToJson } from "./yaml-to-json";

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
    slug: "json-formatter",
    name: "JSON Formatter",
    description: "Beautify, minify, and validate JSON.",
    category: "JSON",
    keywords: ["json", "beautify", "format", "minify", "validate", "pretty"],
    status: "stable",
    Component: JsonFormatter,
  },
  {
    slug: "json-to-yaml",
    name: "JSON → YAML",
    description: "Convert JSON to YAML.",
    category: "JSON",
    keywords: ["json", "yaml", "convert"],
    status: "stable",
    Component: JsonToYaml,
  },
  {
    slug: "yaml-to-json",
    name: "YAML → JSON",
    description: "Convert YAML to JSON.",
    category: "JSON",
    keywords: ["yaml", "json", "convert"],
    status: "stable",
    Component: YamlToJson,
  },
  {
    slug: "json-to-json-schema",
    name: "JSON → JSON Schema",
    description: "Infer a JSON Schema from a sample document.",
    category: "JSON",
    keywords: ["json", "schema", "infer", "draft", "2020-12"],
    status: "stable",
    Component: JsonToJsonSchema,
  },
  {
    slug: "json-schema-to-json",
    name: "JSON Schema → JSON",
    description: "Generate a sample JSON instance from a JSON Schema.",
    category: "JSON",
    keywords: ["json", "schema", "sample", "mock", "generate"],
    status: "stable",
    Component: JsonSchemaToJson,
  },
  {
    slug: "base64",
    name: "Base64 Encode / Decode",
    description: "Encode and decode Base64 and Base64URL.",
    category: "Encoding",
    keywords: ["base64", "base64url", "encode", "decode", "url-safe"],
    status: "stable",
    Component: Base64Tool,
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
