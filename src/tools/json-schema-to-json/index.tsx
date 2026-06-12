"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { ConverterTool } from "@/components/converter-tool";
import { Button } from "@/components/ui/button";
import { schemaToSample } from "./logic";

const SAMPLE = `{
  "type": "object",
  "properties": {
    "id": { "type": "integer", "minimum": 1, "maximum": 999 },
    "email": { "type": "string", "format": "email" },
    "role": { "enum": ["admin", "user", "guest"] },
    "tags": { "type": "array", "items": { "type": "string" }, "minItems": 2 }
  },
  "required": ["id", "email"]
}`;

export function JsonSchemaToJson() {
  const [seed, setSeed] = useState(1);
  const convert = useCallback(
    (input: string) => schemaToSample(input, seed),
    [seed],
  );
  return (
    <ConverterTool
      title="JSON Schema → JSON"
      description="Generate a sample JSON instance from a JSON Schema."
      sample={SAMPLE}
      convert={convert}
      inputLabel="JSON Schema"
      outputLabel="Sample JSON"
      inputLanguage="json"
      outputLanguage="json"
      inputPlaceholder="Paste a JSON Schema…"
      options={
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Seed
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSeed((s) => s + 1)}
          >
            <RefreshCw />
            Regenerate
          </Button>
        </div>
      }
    />
  );
}
