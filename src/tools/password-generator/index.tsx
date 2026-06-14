"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Hint } from "@/components/hint";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CHAR_SETS,
  DEFAULT_OPTIONS,
  estimateStrength,
  generatePassword,
  MAX_LENGTH,
  MIN_LENGTH,
  SET_LABELS,
  validate,
  type CharSet,
  type PasswordOptions,
} from "./logic";

const SET_HINTS: Record<CharSet, string> = {
  lower: "Lowercase letters a–z.",
  upper: "Uppercase letters A–Z.",
  digit: "Digits 0–9.",
  special: "Symbols such as ! @ # $ % & * ( ) - _ = +.",
};

const METER_COLORS = [
  "bg-red-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
] as const;

export function PasswordGeneratorTool() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);
  const [password, setPassword] = useState("");
  // Bumped to force a fresh password without changing options.
  const [nonce, setNonce] = useState(0);

  const validation = useMemo(() => validate(options), [options]);
  const strength = useMemo(() => estimateStrength(options), [options]);

  const update = useCallback(
    (partial: Partial<PasswordOptions>) =>
      setOptions((prev) => ({ ...prev, ...partial })),
    [],
  );

  const toggleSet = useCallback(
    (set: CharSet) =>
      setOptions((prev) => ({
        ...prev,
        sets: { ...prev.sets, [set]: !prev.sets[set] },
      })),
    [],
  );

  const setMin = useCallback(
    (set: CharSet, value: number) =>
      setOptions((prev) => ({
        ...prev,
        min: { ...prev.min, [set]: value },
      })),
    [],
  );

  // Regenerate (debounced) whenever options change or Regenerate is pressed.
  useEffect(() => {
    const handle = setTimeout(() => {
      const result = generatePassword(options);
      setPassword(result.ok ? result.value : "");
    }, 150);
    return () => clearTimeout(handle);
  }, [options, nonce]);

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate strong random passwords — entirely in your browser, using the Web Crypto API."
    >
      <div className="flex flex-wrap items-center gap-2">
        {CHAR_SETS.map((set) => (
          <Hint key={set} text={SET_HINTS[set]}>
            <Button
              variant={options.sets[set] ? "secondary" : "outline"}
              size="sm"
              aria-pressed={options.sets[set]}
              onClick={() => toggleSet(set)}
            >
              {SET_LABELS[set]}
            </Button>
          </Hint>
        ))}

        <Segmented
          aria-label="Exclude ambiguous characters"
          options={[
            {
              label: "All characters",
              value: "all",
              hint: "Include every character, including look-alikes like I l 1 O 0 o.",
            },
            {
              label: "No look-alikes",
              value: "exclude",
              hint: "Drop easily confused characters (I l 1 O 0 o) for easier manual typing.",
            },
          ]}
          value={options.excludeAmbiguous ? "exclude" : "all"}
          onChange={(v) => update({ excludeAmbiguous: v === "exclude" })}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={() => setNonce((n) => n + 1)}>
            <RefreshCw />
            Regenerate
          </Button>
          <CopyButton value={password} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Length" hint={`Total characters, ${MIN_LENGTH}–${MAX_LENGTH}.`}>
          <Input
            type="number"
            className="w-24"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={options.length}
            onChange={(e) => update({ length: Number(e.target.value) })}
          />
        </Field>

        {CHAR_SETS.map((set) => (
          <Field
            key={set}
            label={`Min ${SET_LABELS[set].toLowerCase()}`}
            hint={
              options.sets[set]
                ? `Guarantee at least this many ${SET_LABELS[set].toLowerCase()} characters.`
                : `Enable ${SET_LABELS[set].toLowerCase()} to set a minimum.`
            }
          >
            <Input
              type="number"
              className="w-20"
              min={0}
              max={MAX_LENGTH}
              value={options.min[set]}
              disabled={!options.sets[set]}
              onChange={(e) => setMin(set, Number(e.target.value))}
            />
          </Field>
        ))}
      </div>

      {validation.ok ? (
        <StatusBanner kind="validated">
          {strength.label} — about {strength.bits} bits of entropy.
        </StatusBanner>
      ) : (
        <StatusBanner kind="error">{validation.error}</StatusBanner>
      )}

      <ToolPane label="Password" actions={<CopyButton value={password} />}>
        <CodeEditor value={password} readOnly minHeight="20vh" />
        <div className="mt-2 flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                validation.ok && i <= strength.score
                  ? METER_COLORS[strength.score]
                  : "bg-muted",
              )}
            />
          ))}
        </div>
      </ToolPane>
    </ToolLayout>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const inner = (
    <span className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </span>
  );
  return hint ? <Hint text={hint}>{inner}</Hint> : inner;
}
