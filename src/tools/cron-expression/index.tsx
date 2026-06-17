"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { initialSample } from "@/lib/config";
import type { Result } from "@/lib/result";
import { explainCron, type CronExplanation, type CronMode } from "./logic";

const SAMPLES: Record<CronMode, string> = {
  standard: "*/15 9-17 * * 1-5",
  extended: "0 9 * * MON-FRI",
};

export function CronExpressionTool() {
  const [mode, setMode] = useState<CronMode>("standard");
  const [input, setInput] = useState(() => initialSample(SAMPLES.standard));

  const result: Result<CronExplanation> | null = useMemo(() => {
    if (input.trim() === "") return null;
    return explainCron(input, mode);
  }, [input, mode]);

  const fields = result?.ok ? result.value.fields : [];

  return (
    <ToolLayout
      title="Cron Expression Explainer"
      description="Break a cron expression down field by field — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Syntax"
          options={[
            {
              label: "Standard",
              value: "standard",
              hint: "Classic 5 numeric fields: * , ranges a-b, lists a,b, and steps */n.",
            },
            {
              label: "Macros + Names",
              value: "extended",
              hint: "Also accept @daily/@weekly/@monthly/@yearly/@hourly macros and JAN–DEC / SUN–SAT names.",
            },
          ]}
          value={mode}
          onChange={(v) => {
            setMode(v);
            setInput("");
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput(SAMPLES[mode])}
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
          Enter a cron expression to see what it does. Runs 100% in your browser.
        </StatusBanner>
      ) : (
        <StatusBanner kind="validated">
          Valid cron — 5 fields parsed.
        </StatusBanner>
      )}

      <ToolPanes>
        <ToolPane label="Cron expression">
          <CodeEditor
            value={input}
            onChange={setInput}
            placeholder={
              mode === "extended"
                ? "e.g. 0 9 * * MON-FRI or @daily"
                : "e.g. */15 9-17 * * 1-5"
            }
            autoHeight
          />
        </ToolPane>
        <ToolPane
          label="Schedule"
          actions={<CopyButton value={asText(fields)} />}
        >
          <div className="min-h-[60vh] overflow-auto rounded-md border bg-card p-4">
            {fields.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                {result && !result.ok
                  ? "Fix the expression above to see the schedule."
                  : "The breakdown appears here."}
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-1 pr-3 font-medium">Field</th>
                    <th className="py-1 pr-3 font-medium">Expression</th>
                    <th className="py-1 pr-3 font-medium">Periodicity</th>
                    <th className="py-1 font-medium">Matches</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr
                      key={field.id}
                      className="border-b border-border/50 align-top"
                    >
                      <td className="py-1.5 pr-3 font-medium">{field.label}</td>
                      <td className="py-1.5 pr-3 font-mono break-all">
                        {field.token}
                      </td>
                      <td className="py-1.5 pr-3">{field.periodicity}</td>
                      <td className="py-1.5 font-mono break-all">
                        {field.matches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ToolPane>
      </ToolPanes>
    </ToolLayout>
  );
}

/** Tab-separated `field\texpression\tperiodicity\tmatches` lines for copying. */
function asText(fields: CronExplanation["fields"]): string {
  return fields
    .map((f) => `${f.label}\t${f.token}\t${f.periodicity}\t${f.matches}`)
    .join("\n");
}
