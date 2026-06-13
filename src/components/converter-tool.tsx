"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";

type Language = "json" | "text";

const DEFAULT_INFO_MESSAGE =
  "Ready when you are — paste or type to begin. Runs 100% in your browser.";
const DEFAULT_VALIDATED_MESSAGE = "Looks good — input is valid.";

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
  inputControls,
  outputControls,
  warn,
  infoMessage = DEFAULT_INFO_MESSAGE,
  validatedMessage = DEFAULT_VALIDATED_MESSAGE,
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
  /** Grey banner shown while the input is empty. */
  infoMessage?: string;
  /** Green banner shown when conversion succeeds with no warning. */
  validatedMessage?: string;
  /** Controls rendered under the input pane label (e.g. a format selector). */
  inputControls?: ReactNode;
  /** Controls rendered under the output pane label. */
  outputControls?: ReactNode;
  /**
   * Optional non-blocking notice for valid-but-suspicious input. Must be stable
   * across renders (wrap in useCallback), same contract as `convert`.
   */
  warn?: (input: string) => string | null;
}) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (input.trim() === "") {
        setOutput("");
        setError(null);
        setWarning(null);
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
      setWarning(warn ? warn(input) : null);
    }, 150);
    return () => clearTimeout(handle);
  }, [input, convert, warn]);

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

      {error ? (
        <StatusBanner kind="error">{error}</StatusBanner>
      ) : warning ? (
        <StatusBanner kind="warning">{warning}</StatusBanner>
      ) : input.trim() === "" ? (
        <StatusBanner kind="info">{infoMessage}</StatusBanner>
      ) : (
        <StatusBanner kind="validated">{validatedMessage}</StatusBanner>
      )}

      <ToolPanes>
        <ToolPane label={inputLabel} controls={inputControls}>
          <CodeEditor
            value={input}
            onChange={setInput}
            language={inputLanguage}
            placeholder={inputPlaceholder}
          />
        </ToolPane>
        <ToolPane
          label={outputLabel}
          actions={<CopyButton value={output} />}
          controls={outputControls}
        >
          <CodeEditor value={output} language={outputLanguage} readOnly />
        </ToolPane>
      </ToolPanes>
    </ToolLayout>
  );
}
