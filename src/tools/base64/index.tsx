"use client";

import { AlertCircle, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Segmented } from "@/components/segmented";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import {
  bytesToBase64,
  decodeText,
  encodeText,
  type Base64Variant,
} from "./logic";

type Mode = "encode" | "decode";

const SAMPLE = "Hello, Office Tools! 🔒";

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [input, setInput] = useState("");
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
      title="Base64 Encode / Decode"
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
            { label: "Standard", value: "standard" },
            { label: "URL-safe", value: "url" },
          ]}
          value={variant}
          onChange={setVariant}
        />
        <div className="ml-auto flex items-center gap-2">
          {mode === "encode" && (
            <>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload />
                Encode file
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInput(SAMPLE);
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

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
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
