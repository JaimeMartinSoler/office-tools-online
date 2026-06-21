"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Hint } from "@/components/hint";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_OPTIONS,
  generate,
  KIND_LABELS,
  MAX_COUNT,
  type GenerateOptions,
} from "./logic";

const KIND_HINTS: Record<GenerateOptions["kind"], string> = {
  uuidv4: "Random 128-bit identifier (RFC 4122). The everyday default.",
  uuidv7: "Time-ordered UUID (RFC 9562): a millisecond timestamp prefix makes it sortable and index-friendly.",
  ulid: "26-char Crockford base32, lexically sortable, URL-safe — a compact alternative to UUID v7.",
};

export function UuidUlidGeneratorTool() {
  const [options, setOptions] = useState<GenerateOptions>(DEFAULT_OPTIONS);
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Bumped to force a fresh batch without changing options.
  const [nonce, setNonce] = useState(0);

  const update = useCallback(
    (partial: Partial<GenerateOptions>) =>
      setOptions((prev) => ({ ...prev, ...partial })),
    [],
  );

  useEffect(() => {
    const result = generate(options, Date.now());
    if (result.ok) {
      setIds(result.value);
      setError(null);
    } else {
      setIds([]);
      setError(result.error);
    }
  }, [options, nonce]);

  const isUlid = options.kind === "ulid";
  const text = ids.join("\n");

  return (
    <ToolLayout
      title="UUID / ULID Generator"
      description="Generate UUID v4, UUID v7, and ULID identifiers in bulk — using the Web Crypto API, entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Identifier type"
          options={(["uuidv4", "uuidv7", "ulid"] as const).map((kind) => ({
            label: KIND_LABELS[kind],
            value: kind,
            hint: KIND_HINTS[kind],
          }))}
          value={options.kind}
          onChange={(kind) => update({ kind })}
        />
        <Segmented
          aria-label="Letter case"
          options={[
            { label: "lower", value: "lower", hint: "Lowercase output." },
            { label: "UPPER", value: "upper", hint: "Uppercase output." },
          ]}
          value={options.uppercase ? "upper" : "lower"}
          onChange={(v) => update({ uppercase: v === "upper" })}
        />
        <Hint
          text={
            isUlid
              ? "Braces apply to UUIDs only."
              : "Wrap each UUID in { } braces (e.g. for C#/GUID literals)."
          }
        >
          <Button
            variant={options.braces && !isUlid ? "secondary" : "outline"}
            size="sm"
            aria-pressed={options.braces && !isUlid}
            disabled={isUlid}
            onClick={() => update({ braces: !options.braces })}
          >
            {"{ }"} Braces
          </Button>
        </Hint>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={() => setNonce((n) => n + 1)}>
            <RefreshCw />
            Regenerate
          </Button>
          <CopyButton value={text} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Hint text={`How many identifiers to generate (1–${MAX_COUNT}).`}>
          <span className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Count</span>
            <Input
              type="number"
              className="w-28"
              min={1}
              max={MAX_COUNT}
              value={options.count}
              onChange={(e) => update({ count: Number(e.target.value) })}
            />
          </span>
        </Hint>
      </div>

      {error ? (
        <StatusBanner kind="error">{error}</StatusBanner>
      ) : (
        <StatusBanner kind="validated">
          Generated {ids.length} {KIND_LABELS[options.kind]}
          {ids.length === 1 ? "" : "s"}. Click Regenerate for a fresh batch.
        </StatusBanner>
      )}

      <ToolPane label="Identifiers" actions={<CopyButton value={text} />}>
        <CodeEditor value={text} readOnly minHeight="40vh" />
      </ToolPane>
    </ToolLayout>
  );
}
