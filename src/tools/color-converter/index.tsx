"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialSample } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  formatColor,
  gradeContrast,
  parseColor,
  type ColorFormats,
  type Rgb,
} from "./logic";

const SAMPLE = "#3b82f6";

const FORMAT_LABELS: { key: keyof ColorFormats; label: string }[] = [
  { key: "hex", label: "Hex" },
  { key: "rgb", label: "RGB" },
  { key: "hsl", label: "HSL" },
  { key: "oklch", label: "OKLCH" },
];

/** CSS rgba() string for rendering a parsed colour in the browser. */
function css(c: Rgb): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

function hexNoAlpha(c: Rgb): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

export function ColorConverterTool() {
  const [input, setInput] = useState(() => initialSample(SAMPLE));
  const [bg, setBg] = useState("#ffffff");

  const parsed = useMemo(() => (input.trim() === "" ? null : parseColor(input)), [input]);
  const color = parsed?.ok ? parsed.value : null;
  const formats = color ? formatColor(color) : null;

  const bgParsed = useMemo(() => parseColor(bg), [bg]);
  const bgColor = bgParsed.ok ? bgParsed.value : null;
  const contrast = color && bgColor ? gradeContrast(color, bgColor) : null;

  return (
    <ToolLayout
      title="Color Converter"
      description="Convert colours between hex, rgb, hsl, and oklch, and check WCAG contrast — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label="Pick a colour"
          value={color ? hexNoAlpha(color) : "#000000"}
          onChange={(e) => setInput(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded-md border bg-transparent p-0.5"
        />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="#3b82f6, rgb(59 130 246), hsl(217 91% 60%), oklch(0.62 0.19 259)…"
          className="max-w-md font-mono"
          spellCheck={false}
          aria-label="Colour value"
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

      {parsed && !parsed.ok ? (
        <StatusBanner kind="error">{parsed.error}</StatusBanner>
      ) : input.trim() === "" ? (
        <StatusBanner kind="info">
          Enter a colour in any notation to convert it. Runs 100% in your browser.
        </StatusBanner>
      ) : (
        <StatusBanner kind="validated">Parsed — converted to every notation.</StatusBanner>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPane label="Formats">
          <div className="flex gap-4">
            <div
              className="size-24 shrink-0 rounded-md border"
              style={{
                background: color
                  ? `${css(color)}`
                  : "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 16px 16px",
              }}
              aria-hidden
            />
            <div className="min-w-0 flex-1 overflow-hidden rounded-md border bg-card">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {FORMAT_LABELS.map(({ key, label }) => {
                    const value = formats ? formats[key] : "";
                    return (
                      <tr
                        key={key}
                        className="border-b border-border/50 last:border-b-0"
                      >
                        <td className="w-20 py-2 pl-3 pr-2 align-middle text-muted-foreground">
                          {label}
                        </td>
                        <td className="py-2 pr-2 align-middle font-mono break-all">
                          {value || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="w-10 py-2 pr-2 text-right align-middle">
                          {value ? <CopyButton value={value} label="" /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ToolPane>

        <ToolPane label="Contrast checker">
          <div className="space-y-3 rounded-md border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Against background</span>
              <input
                type="color"
                aria-label="Pick a background colour"
                value={bgColor ? hexNoAlpha(bgColor) : "#ffffff"}
                onChange={(e) => setBg(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="w-40 font-mono"
                spellCheck={false}
                aria-label="Background colour value"
              />
            </div>

            <div
              className="flex items-center justify-center rounded-md border p-6 text-center"
              style={{
                background: bgColor ? css(bgColor) : "#fff",
                color: color ? css(color) : "#000",
              }}
            >
              <span className="text-lg font-medium">Almost before we knew it, Aa</span>
            </div>

            {contrast ? (
              <>
                <div className="text-2xl font-semibold tabular-nums">
                  {contrast.ratio}
                  <span className="text-base font-normal text-muted-foreground"> : 1</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Grade label="AA (normal)" pass={contrast.aaNormal} />
                  <Grade label="AAA (normal)" pass={contrast.aaaNormal} />
                  <Grade label="AA (large)" pass={contrast.aaLarge} />
                  <Grade label="AAA (large)" pass={contrast.aaaLarge} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a valid foreground and background colour to see the ratio.
              </p>
            )}
          </div>
        </ToolPane>
      </div>
    </ToolLayout>
  );
}

function Grade({ label, pass }: { label: string; pass: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
        pass
          ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-500"
          : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {pass ? "Pass" : "Fail"} · {label}
    </span>
  );
}
