"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { CodeEditorInnerProps } from "./inner";

// ssr:false guarantees CodeMirror never executes during the static prerender.
const CodeEditorInner = dynamic(() => import("./inner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

export function CodeEditor({
  className,
  ...props
}: CodeEditorInnerProps & { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-card [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-transparent [&_.cm-focused]:outline-none",
        className,
      )}
    >
      <CodeEditorInner {...props} />
    </div>
  );
}
