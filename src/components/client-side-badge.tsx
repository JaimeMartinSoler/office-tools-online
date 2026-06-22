import { Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent",
        className,
      )}
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
