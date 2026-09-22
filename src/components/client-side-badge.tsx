import { Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared header-pill styling. Both the client-side badge and the About link wear
 * the same rounded, bordered pill, so the classes live here to keep them in
 * visual parity by construction rather than by copy-paste.
 */
// `bg-muted` (a step darker than the header's `bg-secondary`) keeps the pills
// distinct from the header bar. See docs/STYLE_MIGRATION.md.
export const HEADER_PILL_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent";

/**
 * The privacy promise, made visible. Links to /privacy where the guarantee is
 * explained (and verifiable via the browser Network tab).
 */
export function ClientSideBadge({ className }: { className?: string }) {
  return (
    <Link
      href="/privacy"
      aria-label="100% client-side — your data never leaves this browser"
      title="100% client-side — your data never leaves this browser"
      className={cn(HEADER_PILL_CLASS, className)}
    >
      <Lock className="size-3.5 shrink-0" />
      {/* Short text on tablet/landscape (md), full sentence on desktop (lg),
          icon-only on phones so the header fits without wrapping. */}
      <span className="hidden whitespace-nowrap md:inline lg:hidden">
        100% client-side
      </span>
      <span className="hidden whitespace-nowrap lg:inline">
        100% client-side — your data never leaves this browser
      </span>
    </Link>
  );
}
