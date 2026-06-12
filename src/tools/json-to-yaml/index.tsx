"use client";

import { useCallback } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { jsonToYaml } from "./logic";

const SAMPLE =
  '{"name":"office-tools","private":true,"tags":["json","yaml"],"nested":{"ok":true,"count":3}}';

export function JsonToYaml() {
  const convert = useCallback((input: string) => jsonToYaml(input), []);
  return (
    <ConverterTool
      title="JSON → YAML"
      description="Convert JSON to YAML — entirely in your browser."
      sample={SAMPLE}
      convert={convert}
      inputLabel="JSON"
      outputLabel="YAML"
      inputLanguage="json"
      inputPlaceholder="Paste JSON here…"
    />
  );
}
