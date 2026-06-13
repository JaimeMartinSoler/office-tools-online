"use client";

import dynamic from "next/dynamic";
import type { MarkdownPreviewInnerProps } from "./preview-inner";

// ssr:false keeps marked + DOMPurify out of the static prerender and loads them
// only when the user switches the output to "Formatted" (mirrors CodeEditor).
const MarkdownPreviewInner = dynamic(() => import("./preview-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center rounded-md border bg-card text-sm text-muted-foreground">
      Loading preview…
    </div>
  ),
});

export function MarkdownPreview(props: MarkdownPreviewInnerProps) {
  return <MarkdownPreviewInner {...props} />;
}
