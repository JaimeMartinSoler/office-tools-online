"use client";

import { json } from "@codemirror/lang-json";
import CodeMirror, {
  EditorSelection,
  EditorState,
  EditorView,
  keymap,
  Prec,
} from "@uiw/react-codemirror";
import type { ChangeSpec, Extension } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { toSingleLine } from "./single-line";

export interface CodeEditorInnerProps {
  value: string;
  onChange?: (value: string) => void;
  language?: "json" | "text";
  readOnly?: boolean;
  placeholder?: string;
  /**
   * Soft-wrap long lines instead of scrolling sideways. For panes whose
   * content is usually one long line (tokens, encoded text, hashes).
   */
  wrap?: boolean;
  /**
   * A 1-line field (set by `CodeEditor` for `SIZE_VERTICAL_XS`): no gutters,
   * Enter does nothing and pasted line breaks become spaces.
   */
  singleLine?: boolean;
}

/**
 * Pins the metrics `editorBoxHeight` (sizes.ts) is computed from, so a change
 * to CodeMirror's default theme can't misalign the panes beside an editor.
 */
const METRICS = EditorView.theme({
  ".cm-scroller": { lineHeight: "1.4" },
  ".cm-content": { padding: "4px 0" },
});

const SINGLE_LINE: Extension = [
  Prec.highest(keymap.of([{ key: "Enter", run: () => true }])),
  EditorState.transactionFilter.of((tr) => {
    if (!tr.docChanged || tr.newDoc.lines === 1) return tr;
    const changes: ChangeSpec[] = [];
    let lastEnd = 0;
    tr.changes.iterChanges((from, to, _fromB, _toB, inserted) => {
      changes.push({ from, to, insert: toSingleLine(inserted.toString()) });
      lastEnd = to;
    });
    const set = tr.startState.changes(changes);
    return {
      changes: set,
      selection: EditorSelection.cursor(set.mapPos(lastEnd, 1)),
      scrollIntoView: true,
    };
  }),
];

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
  wrap = false,
  singleLine = false,
}: CodeEditorInnerProps) {
  const { resolvedTheme } = useTheme();

  // Without `wrap`, long lines scroll horizontally instead of wrapping, so
  // the box always shows its full `lines` count of real lines.
  const extensions = useMemo(() => {
    const list: Extension[] = [METRICS];
    if (language === "json") list.push(json());
    if (wrap) list.push(EditorView.lineWrapping);
    if (singleLine) list.push(SINGLE_LINE);
    return list;
  }, [language, wrap, singleLine]);

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
