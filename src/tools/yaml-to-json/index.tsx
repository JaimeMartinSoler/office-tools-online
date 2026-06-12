"use client";

import { useCallback, useState } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { Segmented } from "@/components/segmented";
import type { IndentOption } from "@/lib/json";
import { yamlToJson } from "./logic";

const SAMPLE = `name: office-tools
private: true
tags:
  - json
  - yaml
nested:
  ok: true
  count: 3
`;

const INDENTS: { label: string; value: IndentOption }[] = [
  { label: "2 spaces", value: 2 },
  { label: "4 spaces", value: 4 },
  { label: "Tab", value: "tab" },
];

export function YamlToJson() {
  const [indent, setIndent] = useState<IndentOption>(2);
  const convert = useCallback(
    (input: string) => yamlToJson(input, indent),
    [indent],
  );
  return (
    <ConverterTool
      title="YAML → JSON"
      description="Convert YAML to JSON — entirely in your browser."
      sample={SAMPLE}
      convert={convert}
      inputLabel="YAML"
      outputLabel="JSON"
      outputLanguage="json"
      inputPlaceholder="Paste YAML here…"
      options={
        <Segmented
          aria-label="Indentation"
          options={INDENTS}
          value={indent}
          onChange={setIndent}
        />
      }
    />
  );
}
