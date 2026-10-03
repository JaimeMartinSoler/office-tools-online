import type { ToolContent } from "@/lib/tool-content";

export const SAMPLE_SCHEMA = `{
  "type": "object",
  "properties": {
    "id": { "type": "integer", "minimum": 1, "maximum": 999 },
    "email": { "type": "string", "format": "email" },
    "role": { "enum": ["admin", "user", "guest"] },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}`;

export const content: ToolContent = {
  intro:
    "Works in two directions. **JSON → JSON Schema** infers a draft 2020-12 schema from an example document: it tells `integer` from `number`, merges the items of an array into one item schema, and marks properties as required. **JSON Schema → JSON** does the reverse, generating a sample document from a schema. The generator follows `$ref`, `enum`, `const`, `default`, `allOf`/`anyOf`/`oneOf`, common string formats, and numeric and length bounds. A seed makes each sample reproducible.",
  steps: [
    "Pick a direction: **JSON → JSON Schema** or **JSON Schema → JSON**.",
    "Paste a sample document or a schema, or click **Load sample**.",
    "When inferring, toggle **Required by default** and **Infer enums** to shape the schema.",
    "When generating, change the **Seed** or click **Regenerate** to get a different but reproducible sample.",
    "Copy the result and adjust it by hand — an inferred schema only knows what your one example contained.",
  ],
  examples: [
    {
      title: "Infer a schema from one object",
      note: "JSON → JSON Schema · Required by default on. `7` becomes `integer`, not `number`.",
      input: '{"id":7,"name":"Ada","tags":["admin","ops"]}',
      output:
        '{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "type": "object",\n  "properties": {\n    "id": {\n      "type": "integer"\n    },\n    "name": {\n      "type": "string"\n    },\n    "tags": {\n      "type": "array",\n      "items": {\n        "type": "string"\n      }\n    }\n  },\n  "required": [\n    "id",\n    "name",\n    "tags"\n  ]\n}',
    },
    {
      title: "Optional fields are detected across array items",
      note: "JSON → JSON Schema · Required by default on. `email` appears in only one item, so only `id` is required.",
      input: '[{"id":1,"email":"ada@example.com"},{"id":2}]',
      output:
        '{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "type": "array",\n  "items": {\n    "type": "object",\n    "properties": {\n      "id": {\n        "type": "integer"\n      },\n      "email": {\n        "type": "string"\n      }\n    },\n    "required": [\n      "id"\n    ]\n  }\n}',
    },
    {
      title: "Generate a sample document from a schema",
      note: "JSON Schema → JSON · Seed 1. The id respects the bounds, the formats give realistic placeholders, and the role comes from the enum. Seed 2 gives `\"id\": 734`.",
      input: SAMPLE_SCHEMA,
      inputLabel: "JSON Schema",
      output:
        '{\n  "id": 627,\n  "email": "user@example.com",\n  "role": "admin",\n  "createdAt": "2024-01-01T00:00:00Z"\n}',
      outputLabel: "Sample JSON",
    },
  ],
  faq: [
    {
      question: "Can this validate a JSON document against a schema?",
      answer:
        "No. The tool infers schemas and generates samples, but it doesn't check an existing document against an existing schema. It does check that a schema you paste is usable: it reports input that has no schema keywords or has an unknown `type`. To validate, run the inferred schema through a validator such as Ajv in your own project or tests.",
    },
    {
      question: "How accurate is an inferred schema?",
      answer:
        "It describes exactly the example you gave, and no more. It can't know that a string is really an email or a date, that a number has a maximum, or that a field missing from your example exists. Treat it as a first draft: add `format`, bounds and descriptions by hand. Giving an array of several varied examples produces a better draft than a single object.",
    },
    {
      question: "What does \"Infer enums\" do?",
      answer:
        "For an array of plain values, it adds an `enum` listing the distinct values it saw. For example, `[\"draft\",\"live\",\"draft\"]` gets `\"enum\": [\"draft\", \"live\"]`. Use it for status codes and other closed sets, and turn it off for free-text values, where the enum would be far too strict. It is off by default.",
    },
    {
      question: "What happens when array items have different types?",
      answer:
        "Items with the same shape are merged into one schema. Objects are merged property by property, and a property is required only if every item has it. Items of genuinely different types, such as a mix of strings and numbers, become an `anyOf` listing each variant.",
    },
    {
      question: "Why does the generated sample never change?",
      answer:
        "Generation is deterministic: the same schema and seed always give the same document, which is useful in tests and documentation. Click **Regenerate** or change the **Seed** for a different sample. Values fixed by `const`, `default` or `examples` stay the same under every seed, because the schema pins them.",
    },
  ],
  related:
    "To tidy the sample document first, or to convert the generated data to YAML or CSV, use the [JSON Formatter & Converter](/tools/json-yaml-xml/). To compare an inferred schema before and after an API change, the [JSON Diff](/tools/text-diff/) shows only the fields that changed.",
};
