import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Reads JSON, YAML, XML or CSV and writes any of the four, so one page handles formatting (JSON to JSON), minifying, and conversion in every direction. JSON and XML output can be beautified with 2 spaces, 4 spaces or tabs, or minified to one line. Invalid input produces an error with its line and column instead of a blank pane. For CSV, you choose whether nested fields are flattened into dotted column names and whether cells are read as typed values or kept as text.",
  steps: [
    "Pick the **Input format** above the left pane and the **Output format** above the right one. Choose the same format on both sides to reformat.",
    "Paste your data, or click **Load sample** to see a document in the chosen input format.",
    "For JSON or XML output, choose **Beautify** with an indent or **Minify**.",
    "For CSV, choose **Flatten nested** or **Flat only**, and **Infer types** or **Keep as text**.",
    "Fix any line and column the error points to, then copy the output.",
  ],
  examples: [
    {
      title: "Beautify minified JSON",
      note: "JSON → JSON · Beautify · 2 spaces.",
      input: '{"name":"Ada","langs":["en","fr"],"active":true}',
      output: '{\n  "name": "Ada",\n  "langs": [\n    "en",\n    "fr"\n  ],\n  "active": true\n}',
    },
    {
      title: "JSON to YAML for a config file",
      note: "JSON → YAML. Nested objects become indented blocks and arrays become `-` lists.",
      input: '{"server":{"host":"localhost","port":8080},"debug":false,"tags":["api","v2"]}',
      output: "server:\n  host: localhost\n  port: 8080\ndebug: false\ntags:\n  - api\n  - v2",
    },
    {
      title: "XML with an attribute to JSON",
      note: "XML → JSON. Attributes keep an `@_` prefix so the result converts back to the same XML. Numeric text such as `1965` becomes a JSON number.",
      input: '<book id="42"><title>Dune</title><year>1965</year></book>',
      output: '{\n  "book": {\n    "title": "Dune",\n    "year": 1965,\n    "@_id": "42"\n  }\n}',
    },
    {
      title: "Nested JSON to a spreadsheet-ready CSV",
      note: "JSON → CSV · Flatten nested. Objects become dotted columns, and a list of plain values becomes one quoted cell.",
      input:
        '[{"id":1,"user":{"name":"Ada","city":"London"},"tags":["math","code"]},\n {"id":2,"user":{"name":"Grace","city":"New York"},"tags":["navy"]}]',
      output: 'id,user.name,user.city,tags\n1,Ada,London,"math,code"\n2,Grace,New York,navy',
    },
  ],
  faq: [
    {
      question: "Why does my JSON fail to parse?",
      answer:
        "The usual causes are a trailing comma after the last item, single quotes instead of double quotes, unquoted keys, or comments — all valid JavaScript, none valid JSON. The error names the line and column where parsing stopped; the real mistake is usually just before that point.",
    },
    {
      question: "Why does XML output get wrapped in a <root> element?",
      answer:
        "An XML document needs exactly one top-level element. When your data has one top-level key, that key becomes the root. When it is an array, or an object with several keys, the tool wraps it in `<root>` so the output stays well-formed. Converting that XML back to JSON returns the wrapper as a `root` key.",
    },
    {
      question: "How does JSON-to-CSV handle nested objects and arrays?",
      answer:
        "With **Flat only**, a nested value is an error that names the field, so nothing is dropped silently. With **Flatten nested**, `{\"user\":{\"name\":…}}` becomes a `user.name` column, an array of plain values becomes one comma-joined cell, and an array of objects is stored as a JSON string in its cell. Reading a CSV back with **Flatten nested** turns dotted headers into nested objects again.",
    },
    {
      question: "Why do CSV numbers come out as strings?",
      answer:
        "CSV has no types, so by default (**Keep as text**) every cell stays a string and nothing is changed by accident — ZIP codes keep their leading zeros, for example. Switch to **Infer types** to turn `42` and `9.99` into numbers, `true`/`false` into booleans, and empty cells into `null`.",
    },
    {
      question: "What's the difference between Beautify and Minify?",
      answer:
        "Beautify adds line breaks and indentation for reading; Minify removes all optional whitespace for the smallest payload. Both apply to JSON and XML output. YAML depends on indentation, so it has no minified form, and a tab indent falls back to two spaces there because YAML doesn't allow tabs.",
    },
  ],
  related:
    "To describe this data's shape rather than reformat it, infer a schema with the [JSON Schema tool](/tools/json-json-schema/). To see what changed between two versions of a document, the [JSON Diff](/tools/text-diff/) ignores key order and shows only real differences. For CSV destined for a README, the [Markdown converter](/tools/markdown/) turns it into a table.",
};
