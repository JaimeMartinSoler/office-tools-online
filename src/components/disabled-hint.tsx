"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Wraps a control and, only when `when` is true, shows an on-hover tooltip
 * explaining why it is disabled. The trigger is a wrapping span because a
 * disabled control has `pointer-events-none` and would never receive hover.
 */
export function DisabledHint({
  when,
  reason,
  children,
}: {
  when: boolean;
  reason: string;
  children: ReactNode;
}) {
  if (!when) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
