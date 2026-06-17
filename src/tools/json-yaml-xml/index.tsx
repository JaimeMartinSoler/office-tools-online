"use client";

import { useCallback, useState } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { Segmented } from "@/components/segmented";
import type { IndentOption } from "@/lib/json";
import { convertData, isJsonObjectOrArray, type DataFormat } from "./logic";

const SAMPLES: Record<DataFormat, string> = {
  json: `{
  "team": "Platform",
  "active": true,
  "headcount": 3,
  "members": [
    { "name": "Ada", "role": "Lead", "remote": true, "skills": ["rust", "go"] },
    { "name": "Bob", "role": "SRE", "remote": false, "skills": ["k8s", "linux"] },
    { "name": "Cleo", "role": "Dev", "remote": true, "skills": ["ts", "react"] }
  ],
  "budget": { "currency": "EUR", "amount": 125000.5, "approved": null }
}`,
  yaml: `team: Platform
active: true
headcount: 3
members:
  - name: Ada
    role: Lead
    remote: true
    skills:
      - rust
      - go
  - name: Bob
    role: SRE
    remote: false
    skills:
      - k8s
      - linux
budget:
  currency: EUR
  amount: 125000.5
  approved: null
`,
  xml: `<team>
  <name>Platform</name>
  <active>true</active>
  <headcount>3</headcount>
  <members>
    <name>Ada</name>
    <role>Lead</role>
    <remote>true</remote>
    <skills>rust</skills>
    <skills>go</skills>
  </members>
  <budget>
    <currency>EUR</currency>
    <amount>125000.5</amount>
    <approved></approved>
  </budget>
</team>`,
  csv: `name,role,remote,city,salary
Ada Lovelace,Lead,true,"London, UK",125000
"Hopper, Grace",SRE,false,"New York, NY",118500
Alan Turing,Dev,true,Manchester,99000
`,
};

const JSON_IN_YAML_NOTICE =
  "This input is also valid JSON. Every JSON document is valid YAML, so this works — but if you meant to work with JSON, switch the Input format.";

const FORMATS: { label: string; value: DataFormat }[] = [
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "XML", value: "xml" },
  { label: "CSV", value: "csv" },
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

const NESTED_OPTIONS: { label: string; value: "off" | "on"; hint: string }[] = [
  {
    label: "Flat only",
    value: "off",
    hint: "Any nested object or array makes the CSV conversion fail — use only when every field is a flat scalar.",
  },
  {
    label: "Flatten nested",
    value: "on",
    hint: "Flatten nesting: nested objects become dotted columns (a.b), scalar arrays join with commas, and lists of objects are embedded as JSON. Reading CSV, dotted headers rebuild nested objects.",
  },
];

const VALUE_TYPE_OPTIONS: {
  label: string;
  value: "strings" | "infer";
  hint: string;
}[] = [
  {
    label: "Keep as text",
    value: "strings",
    hint: 'Keep every CSV cell as text — "1" stays "1", "true" stays text. Lossless for IDs, zip codes, and leading zeros.',
  },
  {
    label: "Infer types",
    value: "infer",
    hint: 'Convert CSV cells that look like one: "1" → number 1, "true"/"false" → boolean, empty → null.',
  },
];

const editorLanguage = (format: DataFormat) =>
  format === "json" ? "json" : "text";

export function JsonYamlXml() {
  const [from, setFrom] = useState<DataFormat>("json");
  const [to, setTo] = useState<DataFormat>("yaml");
  const [indent, setIndent] = useState<IndentOption>(2);
  const [mode, setMode] = useState<"beautify" | "minify">("beautify");
  const [nested, setNested] = useState<"off" | "on">("off");
  const [valueTypes, setValueTypes] = useState<"strings" | "infer">("strings");

  // Minify only applies to formats with a compact form (JSON, XML).
  const showMinify = to === "json" || to === "xml";
  const effectiveMinify = mode === "minify" && showMinify;
  // CSV has no indentation; indent also doesn't apply while minifying.
  const showIndent = !effectiveMinify && to !== "csv";
  const pretty = !effectiveMinify;

  // CSV-specific options only take effect when CSV is on one side.
  const csvInvolved = from === "csv" || to === "csv";
  const nestedOn = nested === "on";
  const inferOn = valueTypes === "infer";

  const convert = useCallback(
    (input: string) =>
      convertData(input, from, to, indent, pretty, {
        nested: nestedOn,
        inferTypes: inferOn,
      }),
    [from, to, indent, pretty, nestedOn, inferOn],
  );

  const warn = useCallback(
    (input: string) =>
      from === "yaml" && isJsonObjectOrArray(input) ? JSON_IN_YAML_NOTICE : null,
    [from],
  );

  return (
    <ConverterTool
      title="JSON ↔ YAML ↔ XML ↔ CSV"
      description="Convert, beautify, and minify between JSON, YAML, XML, and CSV — entirely in your browser."
      sample={SAMPLES[from]}
      convert={convert}
      warn={warn}
      validatedMessage={`Looks good — valid ${from.toUpperCase()}.`}
      inputLabel="Input"
      outputLabel="Output"
      inputLanguage={editorLanguage(from)}
      outputLanguage={editorLanguage(to)}
      inputPlaceholder="Paste JSON, YAML, XML, or CSV…"
      options={
        <>
          <Segmented
            aria-label="Indentation"
            options={INDENTS}
            value={indent}
            onChange={setIndent}
            disabled={!showIndent}
            disabledReason={
              to === "csv"
                ? "CSV has no indentation."
                : "Indentation doesn't apply when minifying."
            }
          />
          <Segmented
            aria-label="Beautify or minify"
            options={MODES}
            value={mode}
            onChange={setMode}
            disabled={!showMinify}
            disabledReason="Only JSON and XML can be minified — YAML and CSV have no minified form."
          />
          <Segmented
            aria-label="Nested CSV fields"
            options={NESTED_OPTIONS}
            value={nested}
            onChange={setNested}
            disabled={!csvInvolved}
            disabledReason="Nesting options apply only when CSV is the input or output format."
          />
          <Segmented
            aria-label="CSV value types"
            options={VALUE_TYPE_OPTIONS}
            value={valueTypes}
            onChange={setValueTypes}
            disabled={from !== "csv"}
            disabledReason="Value typing applies only when CSV is the input format."
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
