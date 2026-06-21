"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialSample } from "@/lib/config";
import {
  BASE_LABELS,
  BASE_PREFIX,
  BASES,
  bitLength,
  parseValue,
  toAllBases,
  toBitGroups,
  type Base,
} from "./logic";

const SAMPLE = "255";

export function NumberBaseConverterTool() {
  const [input, setInput] = useState(() => initialSample(SAMPLE));
  const [base, setBase] = useState<Base | "auto">("auto");

  const result = useMemo(() => {
    if (input.trim() === "") return null;
    return parseValue(input, base);
  }, [input, base]);

  const value = result?.ok ? result.value : null;
  const all = value !== null ? toAllBases(value) : null;
  const bits = value !== null ? toBitGroups(value) : null;
  const bitCount = value !== null ? bitLength(value) : 0;

  return (
    <ToolLayout
      title="Number Base Converter"
      description="Convert integers between binary, octal, decimal, and hexadecimal — with a bit-by-bit view. Runs entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Input base"
          options={[
            {
              label: "Auto",
              value: "auto",
              hint: "Detect the base from a 0b / 0o / 0x prefix, otherwise read as decimal.",
            },
            { label: "Bin", value: "bin", hint: "Read the input as binary (base 2)." },
            { label: "Oct", value: "oct", hint: "Read the input as octal (base 8)." },
            { label: "Dec", value: "dec", hint: "Read the input as decimal (base 10)." },
            { label: "Hex", value: "hex", hint: "Read the input as hexadecimal (base 16)." },
          ]}
          value={base}
          onChange={setBase}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInput("")}
            disabled={input === ""}
          >
            Clear
          </Button>
        </div>
      </div>

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={base === "auto" ? "e.g. 255, 0xFF, 0b1010…" : `Enter a ${BASE_LABELS[base].toLowerCase()} number…`}
        className="h-10 font-mono text-base"
        spellCheck={false}
        aria-label="Number to convert"
      />

      {result && !result.ok ? (
        <StatusBanner kind="error">{result.error}</StatusBanner>
      ) : input.trim() === "" ? (
        <StatusBanner kind="info">
          Enter a number to convert across bases. Runs 100% in your browser.
        </StatusBanner>
      ) : (
        <StatusBanner kind="validated">
          Converted — {bitCount} significant bit{bitCount === 1 ? "" : "s"}.
        </StatusBanner>
      )}

      <ToolPane label="Conversions">
        <div className="overflow-hidden rounded-md border bg-card">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {BASES.map((b) => {
                const text = all ? all[b] : "";
                const display = text
                  ? (BASE_PREFIX[b] && text[0] !== "-"
                      ? BASE_PREFIX[b] + text
                      : text)
                  : "";
                return (
                  <tr key={b} className="border-b border-border/50 last:border-b-0">
                    <td className="w-32 py-2 pl-4 pr-3 align-middle text-muted-foreground">
                      {BASE_LABELS[b]}
                    </td>
                    <td className="py-2 pr-3 align-middle font-mono break-all">
                      {display || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="w-12 py-2 pr-3 text-right align-middle">
                      {display ? <CopyButton value={display} label="" /> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ToolPane>

      <ToolPane label="Bits">
        <div className="min-h-[12vh] rounded-md border bg-card p-4">
          {bits ? (
            <div className="flex flex-wrap items-start gap-x-6 gap-y-3 font-mono text-sm">
              {bits.sign === "-" && (
                <span className="self-center text-muted-foreground">negative of:</span>
              )}
              {bits.bytes.map((byte, byteIndex) => {
                // Bit index of the most-significant bit in this byte.
                const msb = (bits.bytes.length - byteIndex) * 8 - 1;
                return (
                  <div key={byteIndex} className="flex gap-1">
                    {byte.split("").map((bit, i) => (
                      <span
                        key={i}
                        className="flex flex-col items-center gap-1"
                        title={`bit ${msb - i}`}
                      >
                        <span
                          className={
                            bit === "1"
                              ? "flex size-6 items-center justify-center rounded bg-primary/15 font-medium text-primary"
                              : "flex size-6 items-center justify-center rounded bg-muted text-muted-foreground"
                          }
                        >
                          {bit}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {msb - i}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              The bit-by-bit view appears here.
            </div>
          )}
        </div>
      </ToolPane>
    </ToolLayout>
  );
}
