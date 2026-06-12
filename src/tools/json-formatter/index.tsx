"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import {
  ToolLayout,
  ToolPane,
  ToolPanes,
} from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { beautify, minify, type IndentOption } from "./logic";

type Mode = "beautify" | "minify";

const SAMPLE =
  '{"name":"office-tools","private":true,"tags":["json","yaml","base64"],"nested":{"ok":true,"count":3}}';

const INDENT_OPTIONS: { label: string; value: IndentOption }[] = [
  { label: "2 spaces", value: 2 },
  { label: "4 spaces", value: 4 },
  { label: "Tab", value: "tab" },
];

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("beautify");
  const [indent, setIndent] = useState<IndentOption>(2);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Run the conversion on a short debounce as the user types.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (input.trim() === "") {
        setOutput("");
        setError(null);
        return;
      }
      const result = mode === "beautify" ? beautify(input, indent) : minify(input);
      if (result.ok) {
        setOutput(result.value);
        setError(null);
      } else {
        setOutput("");
        setError(result.error);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [input, mode, indent]);

  const status = useMemo(() => {
    if (input.trim() === "") return null;
    return error ? "error" : "valid";
  }, [input, error]);

  return (
    <ToolLayout
      title="JSON Formatter"
      description="Beautify, minify, and validate JSON — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border p-0.5">
          <Button
            variant={mode === "beautify" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("beautify")}
          >
            Beautify
          </Button>
          <Button
            variant={mode === "minify" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("minify")}
          >
            Minify
          </Button>
        </div>

        {mode === "beautify" && (
          <div className="inline-flex rounded-md border p-0.5">
            {INDENT_OPTIONS.map((opt) => (
              <Button
                key={String(opt.value)}
                variant={indent === opt.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIndent(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput(SAMPLE)}
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

      {status && (
        <div
          className={
            status === "error"
              ? "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground"
          }
        >
          {status === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          )}
          <span>{status === "error" ? error : "Valid JSON"}</span>
        </div>
      )}

      <ToolPanes>
        <ToolPane label="Input">
          <CodeEditor
            value={input}
            onChange={setInput}
            language="json"
            placeholder="Paste JSON here…"
          />
        </ToolPane>
        <ToolPane
          label="Output"
          actions={<CopyButton value={output} />}
        >
          <CodeEditor value={output} language="json" readOnly />
        </ToolPane>
      </ToolPanes>
    </ToolLayout>
  );
}
