"use client";

import { DisabledHint } from "@/components/disabled-hint";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface SegmentedOption<T extends string | number> {
  label: string;
  value: T;
  /** Optional on-hover tooltip explaining what this option does. */
  hint?: string;
}

/** A small segmented button group used for tool options. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  disabledReason,
  "aria-label": ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** When true, the whole group is grayed out and non-interactive. */
  disabled?: boolean;
  /** When disabled, an on-hover tooltip explaining why. */
  disabledReason?: string;
  "aria-label"?: string;
}) {
  return (
    <DisabledHint when={disabled && !!disabledReason} reason={disabledReason ?? ""}>
      <div
        className="inline-flex rounded-md border p-0.5"
        aria-label={ariaLabel}
        aria-disabled={disabled}
      >
        {options.map((opt) => {
          const button = (
            <Button
              key={String(opt.value)}
              variant={value === opt.value ? "secondary" : "ghost"}
              size="sm"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </Button>
          );
          // Per-option hint only shows when the group is interactive; a
          // disabled group already explains itself via `disabledReason`.
          if (!opt.hint || disabled) return button;
          return (
            <Tooltip key={String(opt.value)}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent>{opt.hint}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </DisabledHint>
  );
}
