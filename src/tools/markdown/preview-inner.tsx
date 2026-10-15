"use client";

import DOMPurify from "dompurify";
import { editorBoxHeight, SIZE_VERTICAL_XL } from "@/components/code-editor/sizes";
import { markdownToHtml } from "./logic";

export interface MarkdownPreviewInnerProps {
  markdown: string;
}

/**
 * Renders Markdown as styled HTML. The Markdown is converted with marked
 * (logic.ts) and sanitised with DOMPurify before it ever touches the DOM, so a
 * malicious snippet in the input can't run script. Loaded client-only via the
 * dynamic wrapper in ./preview.tsx.
 */
export default function MarkdownPreviewInner({
  markdown,
}: MarkdownPreviewInnerProps) {
  const html = DOMPurify.sanitize(markdownToHtml(markdown));

  return (
    <div
      className="prose prose-sm max-w-none overflow-auto rounded-md border bg-card p-4 dark:prose-invert"
      // Same height as the Markdown/HTML editor beside it.
      style={{ height: editorBoxHeight(SIZE_VERTICAL_XL) }}
      // Sanitised above; external images/links won't load under the site CSP.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
