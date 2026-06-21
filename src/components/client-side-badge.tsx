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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent",
        className,
      )}
    >
      <Lock className="size-3.5 shrink-0" />
      <span className="truncate">
        100% client-side — your data never leaves this browser
      </span>
    </Link>
  );
}
