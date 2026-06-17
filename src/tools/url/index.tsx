"use client";

import { useEffect, useMemo, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { initialSample } from "@/lib/config";
import {
  decodeUrl,
  encodeUrl,
  parseQuery,
  type ParsedQuery,
  type UrlVariant,
} from "./logic";

type Mode = "encode" | "decode" | "parse";

const SAMPLES: Record<Mode, string> = {
  encode: "name=Ada Lovelace & role=Engineer? café 😀",
  decode: "name%3DAda%20Lovelace%20%26%20role%3DEngineer%3F%20caf%C3%A9%20%F0%9F%98%80",
  parse: "https://example.com/search?q=hello world&lang=en&page=2#results",
};

export function UrlTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<UrlVariant>("component");
  const [input, setInput] = useState(() => initialSample(SAMPLES.encode));
  const [output, setOutput] = useState("");
  const [parsed, setParsed] = useState<ParsedQuery | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (input.trim() === "") {
        setOutput("");
        setParsed(null);
        setError(null);
        return;
      }
      if (mode === "parse") {
        const result = parseQuery(input);
        if (result.ok) {
          setParsed(result.value);
          setOutput("");
          setError(null);
        } else {
          setParsed(null);
          setError(result.error);
        }
        return;
      }
      const result =
        mode === "encode"
          ? encodeUrl(input, variant)
          : decodeUrl(input, variant);
      setParsed(null);
      if (result.ok) {
        setOutput(result.value);
        setError(null);
      } else {
        setOutput("");
        setError(result.error);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [input, mode, variant]);

  const banner = useMemo(() => {
    if (error) return <StatusBanner kind="error">{error}</StatusBanner>;
    if (input.trim() === "") {
      return (
        <StatusBanner kind="info">
          Ready when you are — paste or type to begin. Runs 100% in your
          browser.
        </StatusBanner>
      );
    }
    if (mode === "parse") {
      if (!parsed) return null;
      const count = parsed.params.length;
      if (count === 0) {
        return (
          <StatusBanner kind="warning">
            {parsed.url
              ? "Parsed the URL — it has no query parameters."
              : "No query parameters found."}
          </StatusBanner>
        );
      }
      return (
        <StatusBanner kind="validated">
          Parsed {count} parameter{count === 1 ? "" : "s"}.
        </StatusBanner>
      );
    }
    if (!output) return null;
    return (
      <StatusBanner kind="validated">
        {mode === "encode"
          ? "Looks good — URL-encoded."
          : "Looks good — decoded."}
      </StatusBanner>
    );
  }, [error, input, mode, output, parsed]);

  return (
    <ToolLayout
      title="URL Encoder / Decoder + Query Parser"
      description="Percent-encode or decode text and break a URL's query string into key/value pairs — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Mode"
          options={[
            { label: "Encode", value: "encode" },
            { label: "Decode", value: "decode" },
            {
              label: "Parse query",
              value: "parse",
              hint: "Split a full URL or query string into decoded key/value parameters.",
            },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Segmented
          aria-label="Encoding"
          options={[
            {
              label: "Component",
              value: "component",
              hint: "encodeURIComponent / decodeURIComponent: escapes reserved characters like & = ? / — use for a single query value or path segment.",
            },
            {
              label: "Full URL",
              value: "full",
              hint: "encodeURI / decodeURI: leaves URL structure (: / ? # & =) intact — use for an entire URL.",
            },
          ]}
          value={variant}
          onChange={setVariant}
          disabled={mode === "parse"}
          disabledReason="Encoding mode only applies to Encode and Decode."
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput(SAMPLES[mode])}
          >
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setInput("");
              setOutput("");
              setParsed(null);
            }}
            disabled={input === "" && output === "" && parsed === null}
          >
            Clear
          </Button>
        </div>
      </div>

      {banner}

      <ToolPanes>
        <ToolPane label={mode === "decode" ? "Encoded" : "Input"}>
          <CodeEditor
            value={input}
            onChange={setInput}
            placeholder={
              mode === "parse"
                ? "Paste a URL or query string…"
                : mode === "decode"
                  ? "Paste percent-encoded text…"
                  : "Type or paste text…"
            }
            autoHeight
          />
        </ToolPane>
        {mode === "parse" ? (
          <ToolPane label="Parameters" actions={<CopyButton value={paramsAsText(parsed)} />}>
            <QueryResults parsed={parsed} />
          </ToolPane>
        ) : (
          <ToolPane
            label={mode === "decode" ? "Decoded" : "Encoded"}
            actions={<CopyButton value={output} />}
          >
            <CodeEditor value={output} readOnly />
          </ToolPane>
        )}
      </ToolPanes>
    </ToolLayout>
  );
}

/** Tab-separated `key\tvalue` lines for the copy button. */
function paramsAsText(parsed: ParsedQuery | null): string {
  if (!parsed) return "";
  return parsed.params.map((p) => `${p.key}\t${p.value}`).join("\n");
}

function QueryResults({ parsed }: { parsed: ParsedQuery | null }) {
  if (!parsed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-md border bg-card p-4 text-sm text-muted-foreground">
        Parsed parameters will appear here.
      </div>
    );
  }
  return (
    <div className="flex min-h-[60vh] flex-col gap-4 overflow-auto rounded-md border bg-card p-4">
      {parsed.url && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {(
            [
              ["Protocol", parsed.url.protocol],
              ["Host", parsed.url.host],
              ["Path", parsed.url.path],
              ["Fragment", parsed.url.hash || "—"],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-medium text-muted-foreground">{label}</dt>
              <dd className="break-all font-mono">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {parsed.params.length === 0 ? (
        <p className="text-sm text-muted-foreground">No query parameters.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-1 pr-3 font-medium">Key</th>
              <th className="py-1 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {parsed.params.map((param, i) => (
              <tr key={`${param.key}-${i}`} className="border-b border-border/50 align-top">
                <td className="py-1 pr-3 break-all">{param.key}</td>
                <td className="py-1 break-all">{param.value || <span className="text-muted-foreground">(empty)</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
