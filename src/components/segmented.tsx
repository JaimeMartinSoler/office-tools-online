"use client";

import { Button } from "@/components/ui/button";

export interface SegmentedOption<T extends string | number> {
  label: string;
  value: T;
}

/** A small segmented button group used for tool options. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5" aria-label={ariaLabel}>
      {options.map((opt) => (
        <Button
          key={String(opt.value)}
          variant={value === opt.value ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
