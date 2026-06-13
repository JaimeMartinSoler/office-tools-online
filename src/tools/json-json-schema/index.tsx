"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { Hint } from "@/components/hint";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { inferSchema, looksLikeJsonSchema, schemaToSample } from "./logic";

type Direction = "infer" | "generate";

const SCHEMA_IN_INFER_NOTICE =
  "This input looks like a JSON Schema, not a sample document. JSON → JSON Schema infers a schema from sample data — if you meant to generate sample data from this schema, switch to JSON Schema → JSON.";

const JSON_SAMPLE = `{
  "id": 1,
  "name": "Ada",
  "active": true,
  "roles": ["admin", "user"],
  "profile": {
    "age": 36
  }
}`;

const SCHEMA_SAMPLE = `{
  "type": "object",
  "properties": {
    "id": { "type": "integer", "minimum": 1, "maximum": 999 },
    "email": { "type": "string", "format": "email" },
    "role": { "enum": ["admin", "user", "guest"] },
    "tags": { "type": "array", "items": { "type": "string" }, "minItems": 2 }
  },
  "required": ["id", "email"]
}`;

const DIRECTIONS: { label: string; value: Direction; hint: string }[] = [
  {
    label: "JSON → JSON Schema",
    value: "infer",
    hint: "Infer a JSON Schema (draft 2020-12) that describes a sample JSON document.",
  },
  {
    label: "JSON Schema → JSON",
    value: "generate",
    hint: "Generate a sample JSON instance that satisfies a JSON Schema.",
  },
];

export function JsonJsonSchema() {
  const [direction, setDirection] = useState<Direction>("infer");
  const [requiredByDefault, setRequiredByDefault] = useState(true);
  const [inferEnums, setInferEnums] = useState(false);
  const [seed, setSeed] = useState(1);

  const isInfer = direction === "infer";

  const convert = useCallback(
    (input: string) =>
      isInfer
        ? inferSchema(input, { requiredByDefault, inferEnums })
        : schemaToSample(input, seed),
    [isInfer, requiredByDefault, inferEnums, seed],
  );

  const warn = useCallback(
    (input: string) =>
      isInfer && looksLikeJsonSchema(input) ? SCHEMA_IN_INFER_NOTICE : null,
    [isInfer],
  );

  return (
    <ConverterTool
      title="JSON ↔ JSON Schema"
      description="Infer a JSON Schema from a sample, or generate a sample from a schema — entirely in your browser."
      sample={isInfer ? JSON_SAMPLE : SCHEMA_SAMPLE}
      convert={convert}
      warn={warn}
      validatedMessage={
        isInfer ? "Looks good — valid JSON." : "Looks good — valid JSON Schema."
      }
      inputLabel={isInfer ? "JSON" : "JSON Schema"}
      outputLabel={isInfer ? "JSON Schema" : "Sample JSON"}
      inputLanguage="json"
      outputLanguage="json"
      inputPlaceholder={
        isInfer ? "Paste a sample JSON document…" : "Paste a JSON Schema…"
      }
      options={
        <>
          <Segmented
            aria-label="Direction"
            options={DIRECTIONS}
            value={direction}
            onChange={setDirection}
          />
          <Hint text="Mark every property present in the sample as required in the inferred schema. Active in JSON → JSON Schema mode.">
            <Button
              variant={requiredByDefault ? "secondary" : "outline"}
              size="sm"
              disabled={!isInfer}
              onClick={() => setRequiredByDefault((v) => !v)}
            >
              Required by default
            </Button>
          </Hint>
          <Hint text="Emit an enum of the observed values for arrays of primitives, instead of a generic item type. Active in JSON → JSON Schema mode.">
            <Button
              variant={inferEnums ? "secondary" : "outline"}
              size="sm"
              disabled={!isInfer}
              onClick={() => setInferEnums((v) => !v)}
            >
              Infer enums
            </Button>
          </Hint>
          <Hint text="Seed for the deterministic generator — the same seed always produces the same sample. Active in JSON Schema → JSON mode.">
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Seed
              <input
                type="number"
                value={seed}
                disabled={isInfer}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              />
            </label>
          </Hint>
          <Hint text="Generate a different sample by advancing the seed. Active in JSON Schema → JSON mode.">
            <Button
              variant="outline"
              size="sm"
              disabled={isInfer}
              onClick={() => setSeed((s) => s + 1)}
            >
              <RefreshCw />
              Regenerate
            </Button>
          </Hint>
        </>
      }
    />
  );
}
