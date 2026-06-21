"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { initialSample } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  computeDiff,
  type Cell,
  type DiffMode,
  type Row,
  type Segment,
} from "./logic";

type View = "split" | "unified";

const SAMPLE_ORIGINAL = `{
  "name": "office-tools",
  "version": "1.0.0",
  "private": true,
  "features": ["json", "yaml"]
}`;

const SAMPLE_CHANGED = `{
  "name": "office-tools",
  "version": "1.1.0",
  "private": true,
  "features": ["json", "yaml", "diff"]
}`;

const SEGMENT_CLASS: Record<Segment["type"], string> = {
  equal: "",
  delete: "rounded-sm bg-red-500/30 dark:bg-red-500/30",
  insert: "rounded-sm bg-green-500/30 dark:bg-green-500/30",
};

export function TextDiffTool() {
  const [original, setOriginal] = useState(() => initialSample(SAMPLE_ORIGINAL));
  const [changed, setChanged] = useState(() => initialSample(SAMPLE_CHANGED));
  const [mode, setMode] = useState<DiffMode>("json");
  const [view, setView] = useState<View>("split");

  const result = useMemo(
    () => computeDiff(original, changed, mode),
    [original, changed, mode],
  );

  return (
    <ToolLayout
      title="Text / JSON Diff"
      description="Compare two texts side by side with line and character-level highlighting. JSON mode ignores key order and formatting. Runs entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Diff mode"
          options={[
            { label: "Text", value: "text", hint: "Compare the inputs line by line, exactly as typed." },
            {
              label: "JSON",
              value: "json",
              hint: "Normalise both sides (sort keys, re-indent) so only real value/structure differences show.",
            },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Segmented
          aria-label="View"
          options={[
            { label: "Side-by-side", value: "split", hint: "Original and changed in two aligned columns." },
            { label: "Unified", value: "unified", hint: "A single column with - removed and + added lines." },
          ]}
          value={view}
          onChange={setView}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOriginal(SAMPLE_ORIGINAL);
              setChanged(SAMPLE_CHANGED);
            }}
          >
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOriginal("");
              setChanged("");
            }}
            disabled={original === "" && changed === ""}
          >
            Clear
          </Button>
        </div>
      </div>

      {!result.ok ? (
        <StatusBanner kind="error">{result.error}</StatusBanner>
      ) : result.value.identical ? (
        <StatusBanner kind="validated">
          The two inputs are identical{mode === "json" ? " (after normalising JSON)" : ""}.
        </StatusBanner>
      ) : (
        <StatusBanner kind="info">
          <span className="text-green-600 dark:text-green-500">+{result.value.additions} added</span>
          {", "}
          <span className="text-destructive">−{result.value.deletions} removed</span>. Highlights
          show the exact changed characters.
        </StatusBanner>
      )}

      <ToolPanes>
        <ToolPane label="Original">
          <CodeEditor
            value={original}
            onChange={setOriginal}
            language={mode === "json" ? "json" : "text"}
            placeholder="Paste the original…"
            autoHeight
          />
        </ToolPane>
        <ToolPane label="Changed">
          <CodeEditor
            value={changed}
            onChange={setChanged}
            language={mode === "json" ? "json" : "text"}
            placeholder="Paste the changed version…"
            autoHeight
          />
        </ToolPane>
      </ToolPanes>

      {result.ok && (
        <ToolPane label="Differences">
          <div className="overflow-auto rounded-md border bg-card">
            {view === "split" ? (
              <SplitView rows={result.value.rows} />
            ) : (
              <UnifiedView rows={result.value.rows} />
            )}
          </div>
        </ToolPane>
      )}
    </ToolLayout>
  );
}

function renderSegments(cell: Cell | null) {
  if (!cell) return null;
  return cell.segments.map((seg, i) => (
    <span key={i} className={SEGMENT_CLASS[seg.type]}>
      {seg.text}
    </span>
  ));
}

const GUTTER =
  "select-none border-r border-border/60 px-2 text-right text-xs text-muted-foreground tabular-nums";
const CODE = "whitespace-pre-wrap break-words px-3 font-mono text-[13px] leading-relaxed";

function SplitView({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col className="w-10" />
        <col className="w-1/2" />
        <col className="w-10" />
        <col />
      </colgroup>
      <tbody>
        {rows.map((row, i) => {
          const leftTint =
            row.type === "delete" || row.type === "modify" ? "bg-red-500/10" : "";
          const rightTint =
            row.type === "insert" || row.type === "modify" ? "bg-green-500/10" : "";
          return (
            <tr key={i} className="align-top">
              <td className={cn(GUTTER, leftTint)}>{row.left?.lineNo ?? ""}</td>
              <td className={cn(CODE, leftTint)}>{renderSegments(row.left)}</td>
              <td className={cn(GUTTER, rightTint)}>{row.right?.lineNo ?? ""}</td>
              <td className={cn(CODE, rightTint)}>{renderSegments(row.right)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Flatten rows into single-column unified lines (modify → a delete + insert). */
function UnifiedView({ rows }: { rows: Row[] }) {
  const lines: { sign: string; tint: string; cell: Cell }[] = [];
  for (const row of rows) {
    if (row.type === "equal" && row.left) {
      lines.push({ sign: " ", tint: "", cell: row.left });
    } else if (row.type === "delete" && row.left) {
      lines.push({ sign: "−", tint: "bg-red-500/10", cell: row.left });
    } else if (row.type === "insert" && row.right) {
      lines.push({ sign: "+", tint: "bg-green-500/10", cell: row.right });
    } else if (row.type === "modify") {
      if (row.left) lines.push({ sign: "−", tint: "bg-red-500/10", cell: row.left });
      if (row.right) lines.push({ sign: "+", tint: "bg-green-500/10", cell: row.right });
    }
  }
  return (
    <table className="w-full border-collapse">
      <tbody>
        {lines.map((line, i) => (
          <tr key={i} className="align-top">
            <td className={cn(GUTTER, line.tint)}>{line.cell.lineNo}</td>
            <td
              className={cn(
                "select-none px-1 text-center font-mono text-[13px] text-muted-foreground",
                line.tint,
              )}
            >
              {line.sign}
            </td>
            <td className={cn(CODE, line.tint)}>{renderSegments(line.cell)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
