"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Segmented } from "@/components/segmented";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { allCases } from "./logic";

const SAMPLE = "Office Tools Online";

export function StringCaseConverter() {
  const [input, setInput] = useState("");
  const [perLine, setPerLine] = useState(false);

  const results = useMemo(() => allCases(input, perLine), [input, perLine]);

  return (
    <ToolLayout
      title="String Case Converter"
      description="Convert text between common naming cases — all in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Mode"
          options={[
            { label: "Whole text", value: "whole" },
            { label: "Per line", value: "line" },
          ]}
          value={perLine ? "line" : "whole"}
          onChange={(v) => setPerLine(v === "line")}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
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

      <ToolPanes>
        <ToolPane label="Input">
          <CodeEditor
            value={input}
            onChange={setInput}
            placeholder="Type or paste text…"
          />
        </ToolPane>
        <ToolPane label="All cases">
          <div className="flex flex-col divide-y rounded-md border bg-card">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-3 px-3 py-2"
              >
                <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">
                  {result.label}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-sm">
                  {result.value || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
                <CopyButton
                  value={result.value}
                  label=""
                  variant="ghost"
                  size="icon"
                  aria-label={`Copy ${result.label}`}
                />
              </div>
            ))}
          </div>
        </ToolPane>
      </ToolPanes>
    </ToolLayout>
  );
}
