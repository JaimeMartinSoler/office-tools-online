"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, Ref } from "react";
import { cn } from "@/lib/utils";
import type { CodeEditorInnerProps } from "./inner";
import { editorBoxHeight, SIZE_VERTICAL_XS } from "./sizes";

// ssr:false guarantees CodeMirror never executes during the static prerender.
const CodeEditorInner = dynamic(() => import("./inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

export function CodeEditor({
  className,
  autoHeight = false,
  lines,
  ref,
  ...props
}: Omit<CodeEditorInnerProps, "singleLine"> & {
  className?: string;
  autoHeight?: boolean;
  /** Visible height in lines — one of the `SIZE_VERTICAL_*` constants. */
  lines: number;
  /** The bordered wrapper, e.g. to animate the whole field. */
  ref?: Ref<HTMLDivElement>;
}) {
  const singleLine = lines === SIZE_VERTICAL_XS;
  return (
    <div
      ref={ref}
      // `cm-sized` (globals.css) pins the box and CodeMirror to --cm-height.
      style={{ "--cm-height": editorBoxHeight(lines) } as CSSProperties}
      className={cn(
        "cm-sized overflow-hidden rounded-md border bg-card [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-transparent [&_.cm-focused]:outline-none",
        // On small screens, let flagged inputs shrink to their content instead
        // of holding a tall fixed height that buries the output below the fold.
        autoHeight && "cm-auto-input",
        singleLine && "cm-single-line",
        className,
      )}
    >
      <CodeEditorInner {...props} singleLine={singleLine} />
    </div>
  );
}
