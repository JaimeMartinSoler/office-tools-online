"use client";

import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { initialSample } from "@/lib/config";
import type { Result } from "@/lib/result";
import {
  describe,
  parseDate,
  parseTimestamp,
  type OutputRow,
  type TimestampUnit,
} from "./logic";

type Mode = "timestamp" | "date";

const SAMPLE_TIMESTAMP = "1718323200";
const SAMPLE_DATE = "2024-06-14T00:00:00Z";

export function UnixTimestampTool() {
  const [mode, setMode] = useState<Mode>("timestamp");
  const [unit, setUnit] = useState<TimestampUnit>("auto");
  const [input, setInput] = useState(() => initialSample(SAMPLE_TIMESTAMP));

  const result: Result<OutputRow[]> | null = useMemo(() => {
    if (input.trim() === "") return null;
    const parsed =
      mode === "timestamp" ? parseTimestamp(input, unit) : parseDate(input);
    return parsed.ok ? { ok: true, value: describe(parsed.value) } : parsed;
  }, [input, mode, unit]);

  const rows = result?.ok ? result.value : [];

  function loadNow() {
    const now = new Date();
    setInput(
      mode === "timestamp"
        ? String(Math.floor(now.getTime() / 1000))
        : now.toISOString(),
    );
  }

  return (
    <ToolLayout
      title="Unix Timestamp Converter"
      description="Convert Unix timestamps to dates and back — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Mode"
          options={[
            { label: "Timestamp → Date", value: "timestamp" },
            { label: "Date → Timestamp", value: "date" },
          ]}
          value={mode}
          onChange={(v) => {
            setMode(v);
            setInput("");
          }}
        />
        <Segmented
          aria-label="Unit"
          options={[
            {
              label: "Auto",
              value: "auto",
              hint: "Guess the unit from the number's size: 13-digit values (~1e12) are read as milliseconds, 10-digit values (~1e9) as seconds.",
            },
            {
              label: "Seconds",
              value: "seconds",
              hint: "Treat the number as seconds since 1970-01-01 UTC — the classic Unix time.",
            },
            {
              label: "Milliseconds",
              value: "milliseconds",
              hint: "Treat the number as milliseconds since the epoch — what Date.now() and JavaScript return.",
            },
          ]}
          value={unit}
          onChange={setUnit}
          disabled={mode !== "timestamp"}
          disabledReason="Unit only applies when converting a timestamp to a date."
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadNow}>
            <Clock />
            Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setInput(mode === "timestamp" ? SAMPLE_TIMESTAMP : SAMPLE_DATE)
            }
          >
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInput("")}
            disabled={input === ""}
          >
            Clear
          </Button>
        </div>
      </div>

      {result && !result.ok ? (
        <StatusBanner kind="error">{result.error}</StatusBanner>
      ) : input.trim() === "" ? (
        <StatusBanner kind="info">
          {mode === "timestamp"
            ? "Enter a Unix timestamp to see it as a date. Runs 100% in your browser."
            : "Enter a date to see its Unix timestamp. Runs 100% in your browser."}
        </StatusBanner>
      ) : (
        <StatusBanner kind="validated">Looks good — converted below.</StatusBanner>
      )}

      <ToolPanes>
        <ToolPane label={mode === "timestamp" ? "Unix timestamp" : "Date"}>
          <CodeEditor
            value={input}
            onChange={setInput}
            placeholder={
              mode === "timestamp"
                ? "e.g. 1718323200"
                : "e.g. 2024-06-14T00:00:00Z"
            }
            autoHeight
          />
        </ToolPane>
        <ToolPane label="Result">
          <div className="flex flex-col divide-y rounded-md border bg-card">
            {rows.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {result && !result.ok
                  ? "Fix the input above to see the result."
                  : "Conversions appear here."}
              </div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-36 shrink-0 text-xs font-medium text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm">
                    {row.value}
                  </span>
                  <CopyButton
                    value={row.value}
                    label=""
                    variant="ghost"
                    size="icon"
                    aria-label={`Copy ${row.label}`}
                  />
                </div>
              ))
            )}
          </div>
        </ToolPane>
      </ToolPanes>
    </ToolLayout>
  );
}
