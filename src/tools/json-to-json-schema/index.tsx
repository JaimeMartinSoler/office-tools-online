"use client";

import { useCallback, useState } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { Button } from "@/components/ui/button";
import { inferSchema } from "./logic";

const SAMPLE =
  '{"id":1,"name":"Ada","active":true,"roles":["admin","user"],"profile":{"age":36}}';

export function JsonToJsonSchema() {
  const [requiredByDefault, setRequiredByDefault] = useState(true);
  const [inferEnums, setInferEnums] = useState(false);

  const convert = useCallback(
    (input: string) => inferSchema(input, { requiredByDefault, inferEnums }),
    [requiredByDefault, inferEnums],
  );

  return (
    <ConverterTool
      title="JSON → JSON Schema"
      description="Infer a JSON Schema (draft 2020-12) from a sample document."
      sample={SAMPLE}
      convert={convert}
      inputLabel="JSON"
      outputLabel="JSON Schema"
      inputLanguage="json"
      outputLanguage="json"
      inputPlaceholder="Paste a sample JSON document…"
      options={
        <>
          <Button
            variant={requiredByDefault ? "secondary" : "outline"}
            size="sm"
            onClick={() => setRequiredByDefault((v) => !v)}
          >
            Required by default
          </Button>
          <Button
            variant={inferEnums ? "secondary" : "outline"}
            size="sm"
            onClick={() => setInferEnums((v) => !v)}
          >
            Infer enums
          </Button>
        </>
      }
    />
  );
}
