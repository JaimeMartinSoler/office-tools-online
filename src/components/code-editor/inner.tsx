"use client";

import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";

export interface CodeEditorInnerProps {
  value: string;
  onChange?: (value: string) => void;
  language?: "json" | "text";
  readOnly?: boolean;
  placeholder?: string;
  /** Drop the line-number and fold gutters (set by `CodeEditor` for 1-line boxes). */
  singleLine?: boolean;
}

/**
 * The actual CodeMirror instance. Loaded only on the client (via the dynamic
 * wrapper in ./index.tsx) so nothing CodeMirror touches runs during the static
 * prerender.
 */
export default function CodeEditorInner({
  value,
  onChange,
  language = "text",
  readOnly = false,
  placeholder,
  singleLine = false,
}: CodeEditorInnerProps) {
  const { resolvedTheme } = useTheme();

  // No EditorView.lineWrapping: long lines scroll horizontally instead of
  // wrapping, so the box always shows its full `lines` count of real lines.
  const extensions = language === "json" ? [json()] : [];

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      extensions={extensions}
      basicSetup={{
        lineNumbers: !singleLine,
        foldGutter: !singleLine,
        highlightActiveLine: !readOnly && !singleLine,
        highlightActiveLineGutter: !readOnly && !singleLine,
      }}
      // Keep in step with `editorBoxHeight` (sizes.ts), which assumes this size.
      style={{ fontSize: "0.875rem" }}
    />
  );
}
