"use client";

import { useCallback, useState } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { Segmented } from "@/components/segmented";
import type { IndentOption } from "@/lib/json";
import { convertData, isJsonObjectOrArray, type DataFormat } from "./logic";

const SAMPLES: Record<DataFormat, string> = {
  json: `{
  "note": {
    "to": "Ada",
    "from": "Bob",
    "priority": 1,
    "tags": ["x", "y"]
  }
}`,
  yaml: `note:
  to: Ada
  from: Bob
  priority: 1
  tags:
    - x
    - y
`,
  xml: `<note>
  <to>Ada</to>
  <from>Bob</from>
  <priority>1</priority>
  <tags>x</tags>
  <tags>y</tags>
</note>`,
};

const JSON_IN_YAML_NOTICE =
  "This input is also valid JSON. Every JSON document is valid YAML, so this works — but if you meant to work with JSON, switch the Input format.";

const FORMATS: { label: string; value: DataFormat }[] = [
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "XML", value: "xml" },
];

const INDENTS: { label: string; value: IndentOption }[] = [
  { label: "2 spaces", value: 2 },
  { label: "4 spaces", value: 4 },
  { label: "Tab", value: "tab" },
];

const MODES: { label: string; value: "beautify" | "minify" }[] = [
  { label: "Beautify", value: "beautify" },
  { label: "Minify", value: "minify" },
];

const editorLanguage = (format: DataFormat) =>
  format === "json" ? "json" : "text";

export function JsonYamlXml() {
  const [from, setFrom] = useState<DataFormat>("json");
  const [to, setTo] = useState<DataFormat>("yaml");
  const [indent, setIndent] = useState<IndentOption>(2);
  const [mode, setMode] = useState<"beautify" | "minify">("beautify");

  // Minify only applies to formats with a compact form (JSON, XML).
  const showMinify = to === "json" || to === "xml";
  const effectiveMinify = mode === "minify" && showMinify;
  const showIndent = !effectiveMinify;
  const pretty = !effectiveMinify;

  const convert = useCallback(
    (input: string) => convertData(input, from, to, indent, pretty),
    [from, to, indent, pretty],
  );

  const warn = useCallback(
    (input: string) =>
      from === "yaml" && isJsonObjectOrArray(input) ? JSON_IN_YAML_NOTICE : null,
    [from],
  );

  return (
    <ConverterTool
      title="JSON ↔ YAML ↔ XML"
      description="Convert, beautify, and minify between JSON, YAML, and XML — entirely in your browser."
      sample={SAMPLES[from]}
      convert={convert}
      warn={warn}
      validatedMessage={`Looks good — valid ${from.toUpperCase()}.`}
      inputLabel="Input"
      outputLabel="Output"
      inputLanguage={editorLanguage(from)}
      outputLanguage={editorLanguage(to)}
      inputPlaceholder="Paste JSON, YAML, or XML…"
      options={
        <>
          <Segmented
            aria-label="Indentation"
            options={INDENTS}
            value={indent}
            onChange={setIndent}
            disabled={!showIndent}
            disabledReason="Indentation doesn't apply when minifying."
          />
          <Segmented
            aria-label="Beautify or minify"
            options={MODES}
            value={mode}
            onChange={setMode}
            disabled={!showMinify}
            disabledReason="YAML has no minified form — only JSON and XML can be minified."
          />
        </>
      }
      inputControls={
        <Segmented
          aria-label="Input format"
          options={FORMATS}
          value={from}
          onChange={setFrom}
        />
      }
      outputControls={
        <Segmented
          aria-label="Output format"
          options={FORMATS}
          value={to}
          onChange={setTo}
        />
      }
    />
  );
}
