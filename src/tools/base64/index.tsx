"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { DisabledHint } from "@/components/disabled-hint";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { initialSample } from "@/lib/config";
import {
  bytesToBase64,
  decodeText,
  encodeText,
  type Base64Variant,
} from "./logic";

type Mode = "encode" | "decode";

const SAMPLE = "Hello, Office Dev Tools! 🔒";

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [input, setInput] = useState(() => initialSample(SAMPLE));
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (input.trim() === "") {
        setOutput("");
        setError(null);
        return;
      }
      const result =
        mode === "encode"
          ? encodeText(input, variant)
          : decodeText(input, variant);
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

  async function handleFile(file: File) {
    const buffer = await file.arrayBuffer();
    const encoded = bytesToBase64(new Uint8Array(buffer), variant);
    setMode("encode");
    setInput("");
    setError(null);
    setOutput(encoded);
    setFileNote(`Encoded file: ${file.name} (${file.size} bytes)`);
  }

  function clearFileNote() {
    if (fileNote) setFileNote(null);
  }

  return (
    <ToolLayout
      title="Base64"
      description="Encode and decode Base64 and Base64URL — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Mode"
          options={[
            { label: "Encode", value: "encode" },
            { label: "Decode", value: "decode" },
          ]}
          value={mode}
          onChange={(v) => {
            setMode(v);
            clearFileNote();
          }}
        />
        <Segmented
          aria-label="Variant"
          options={[
            {
              label: "Standard",
              value: "standard",
              hint: "Standard Base64 (RFC 4648 §4): uses + and / with = padding. The default for MIME, data URLs, and most APIs.",
            },
            {
              label: "URL-safe",
              value: "url",
              hint: "URL-safe Base64 (RFC 4648 §5): uses - and _ instead of + and /, and omits = padding — safe inside URLs, query params, and filenames.",
            },
          ]}
          value={variant}
          onChange={setVariant}
        />
        <div className="ml-auto flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <DisabledHint
            when={mode !== "encode"}
            reason="Switch to Encode mode to encode a file."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={mode !== "encode"}
            >
              <Upload />
              Encode file
            </Button>
          </DisabledHint>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (mode === "encode") {
                setInput(SAMPLE);
              } else {
                // Decode mode wants Base64 input — encode the sample with the
                // selected variant so it round-trips back to readable text.
                const encoded = encodeText(SAMPLE, variant);
                setInput(encoded.ok ? encoded.value : SAMPLE);
              }
              clearFileNote();
            }}
          >
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setInput("");
              setOutput("");
              clearFileNote();
            }}
            disabled={input === "" && output === ""}
          >
            Clear
          </Button>
        </div>
      </div>

      {fileNote && (
        <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
          {fileNote}
        </div>
      )}

      {error ? (
        <StatusBanner kind="error">{error}</StatusBanner>
      ) : input.trim() === "" && output === "" ? (
        <StatusBanner kind="info">
          Ready when you are — paste or type to begin. Runs 100% in your browser.
        </StatusBanner>
      ) : (
        <StatusBanner kind="validated">
          {mode === "decode"
            ? `Looks good — valid ${variant === "url" ? "Base64URL" : "Base64"}.`
            : `Looks good — encoded to ${variant === "url" ? "Base64URL" : "Base64"}.`}
        </StatusBanner>
      )}

      <ToolPanes>
        <ToolPane label={mode === "encode" ? "Text" : "Base64"}>
          <CodeEditor
            value={input}
            onChange={(value) => {
              setInput(value);
              clearFileNote();
            }}
            placeholder={
              mode === "encode" ? "Type or paste text…" : "Paste Base64…"
            }
            autoHeight
          />
        </ToolPane>
        <ToolPane
          label={mode === "encode" ? "Base64" : "Text"}
          actions={<CopyButton value={output} />}
        >
          <CodeEditor value={output} readOnly />
        </ToolPane>
      </ToolPanes>
    </ToolLayout>
  );
}
