"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";

type Language = "json" | "text";

/**
 * Reusable single-input → single-output converter used by most tools.
 *
 * `convert` MUST be referentially stable across renders (wrap it in
 * useCallback), otherwise the debounced effect resets on every render.
 */
export function ConverterTool({
  title,
  description,
  sample,
  convert,
  inputLabel = "Input",
  outputLabel = "Output",
  inputLanguage = "text",
  outputLanguage = "text",
  inputPlaceholder,
  options,
}: {
  title: string;
  description: string;
  sample: string;
  convert: (input: string) => Result<string>;
  inputLabel?: string;
  outputLabel?: string;
  inputLanguage?: Language;
  outputLanguage?: Language;
  inputPlaceholder?: string;
  options?: ReactNode;
}) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (input.trim() === "") {
        setOutput("");
        setError(null);
        return;
      }
      const result = convert(input);
      if (result.ok) {
        setOutput(result.value);
        setError(null);
      } else {
        setOutput("");
        setError(result.error);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [input, convert]);

  return (
    <ToolLayout title={title} description={description}>
      <div className="flex flex-wrap items-center gap-2">
        {options}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setInput(sample)}>
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

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ToolPanes>
        <ToolPane label={inputLabel}>
          <CodeEditor
            value={input}
            onChange={setInput}
            language={inputLanguage}
            placeholder={inputPlaceholder}
          />
        </ToolPane>
        <ToolPane label={outputLabel} actions={<CopyButton value={output} />}>
          <CodeEditor value={output} language={outputLanguage} readOnly />
        </ToolPane>
      </ToolPanes>
    </ToolLayout>
  );
}
