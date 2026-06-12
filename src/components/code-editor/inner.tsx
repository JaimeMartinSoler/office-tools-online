"use client";

import { json } from "@codemirror/lang-json";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";

export interface CodeEditorInnerProps {
  value: string;
  onChange?: (value: string) => void;
  language?: "json" | "text";
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: string;
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
  minHeight = "60vh",
}: CodeEditorInnerProps) {
  const { resolvedTheme } = useTheme();

  const extensions = [EditorView.lineWrapping];
  if (language === "json") extensions.push(json());

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
      }}
      style={{ fontSize: "0.875rem", minHeight }}
    />
  );
}
