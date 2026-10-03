import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Compares an original and a changed text line by line using a longest-common-subsequence diff. It pairs up edited lines and highlights the exact characters that changed within them. **JSON** mode first rewrites both sides with sorted keys and uniform indentation, so reordered keys and formatting changes vanish and only real value and structure changes remain. Results can be shown side by side or as a single unified column, with a count of added and removed lines.",
  steps: [
    "Paste the older version into **Original** and the newer one into **Changed**.",
    "Choose **Text** to compare exactly as typed, or **JSON** to ignore key order and formatting.",
    "Pick **Side-by-side** or **Unified** for the **Differences** view.",
    "Read the summary line (for example `+2 added, −1 removed`) and scan the highlighted characters.",
  ],
  examples: [
    {
      title: "A changed config value and an added line",
      note: "Text mode, shown unified. Line 2 is paired as an edit, and within it only the `8`s that became `9`s are highlighted.",
      input: "Original:\nhost: localhost\nport: 8080\ndebug: true\n\nChanged:\nhost: localhost\nport: 9090\ndebug: true\nlog: verbose",
      output: "  host: localhost\n− port: 8080\n+ port: 9090\n  debug: true\n+ log: verbose\n\n+2 added, −1 removed",
      outputLabel: "Differences",
    },
    {
      title: "Two JSON documents that differ only in one value",
      note: "JSON mode. The key order and indentation differ completely, but after normalising only `port` has changed.",
      input:
        'Original:\n{"name":"api","port":8080,"tags":["a","b"]}\n\nChanged:\n{\n  "tags": ["a", "b"],\n  "port": 8081,\n  "name": "api"\n}',
      output:
        '  {\n    "name": "api",\n−   "port": 8080,\n+   "port": 8081,\n    "tags": [\n      "a",\n      "b"\n    ]\n  }\n\n+1 added, −1 removed',
      outputLabel: "Differences",
    },
  ],
  faq: [
    {
      question: "How is JSON mode different from Text mode?",
      answer:
        "JSON mode parses both sides and re-serialises them with object keys sorted alphabetically and 2-space indentation before comparing. Moving a key or reformatting a file therefore shows no difference, while a changed value, added field or removed field does. Array order is kept, because in JSON the order of array items is meaningful.",
    },
    {
      question: "Does it ignore whitespace or letter case?",
      answer:
        "Not in Text mode: every character counts, including trailing spaces and tabs versus spaces, which is often exactly the invisible change you are looking for. For JSON documents, JSON mode ignores formatting whitespace outside strings. There is no case-insensitive option.",
    },
    {
      question: "Why is a whole long line highlighted instead of individual characters?",
      answer:
        "Character-level highlighting is skipped when a pair of edited lines is longer than 5,000 characters combined, to keep the page responsive. For example, a minified JSON file is one very long line. The line is still marked as changed; for a finer diff, beautify both sides first or use JSON mode.",
    },
    {
      question: "What do the + added and − removed counts mean?",
      answer:
        "They count lines. An edited line counts once as removed (the old version) and once as added (the new one), which matches how `git diff` and unified patches report changes. When both counts are zero, the tool says the inputs are identical — in JSON mode, identical after normalising.",
    },
    {
      question: "How large can the inputs be?",
      answer:
        "The diff runs in your browser, and its memory use grows with the number of lines on one side multiplied by the number on the other. A few thousand lines per side is quick. Tens of thousands of lines on each side may take several seconds or run out of memory on a phone.",
    },
  ],
  related:
    "To make a minified document diffable, beautify it with the [JSON Formatter](/tools/json-yaml-xml/) first. To compare the structure of two API responses instead of their values, infer a schema from each with the [JSON Schema tool](/tools/json-json-schema/) and diff the two schemas.",
};
