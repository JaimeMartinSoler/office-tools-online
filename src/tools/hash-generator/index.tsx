"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { Hint } from "@/components/hint";
import { Segmented } from "@/components/segmented";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  algorithms,
  DEFAULT_OPTIONS,
  getAlgorithm,
  hash,
  type AlgorithmId,
  type HashOptions,
  type Pbkdf2Prf,
} from "./logic";

const SAMPLE = "The quick brown fox jumps over the lazy dog";

export function HashGeneratorTool() {
  const [options, setOptions] = useState<HashOptions>(DEFAULT_OPTIONS);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  // Monotonic id so a slow async result can't overwrite a newer request.
  const runId = useRef(0);

  const meta = getAlgorithm(options.algorithm);
  const showKey = (meta.supportsHmac && options.hmac) || meta.supportsKey;

  const update = useCallback(
    (partial: Partial<HashOptions>) =>
      setOptions((prev) => ({ ...prev, ...partial })),
    [],
  );

  function changeAlgorithm(id: AlgorithmId) {
    const next = getAlgorithm(id);
    update({
      algorithm: id,
      lengthBytes: next.defaultLengthBytes ?? options.lengthBytes,
    });
  }

  // Live digests: recompute (debounced) whenever any relevant option changes.
  useEffect(() => {
    if (meta.isKdf) return;
    const handle = setTimeout(async () => {
      if (options.input === "") {
        setOutput("");
        setError(null);
        return;
      }
      const id = ++runId.current;
      const result = await hash(options);
      if (id !== runId.current) return; // a newer request superseded us
      if (result.ok) {
        setOutput(result.value);
        setError(null);
      } else {
        setOutput("");
        setError(result.error);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [options, meta.isKdf]);

  // KDFs are intentionally slow, so they run only on the explicit Generate
  // button. Any edit invalidates a previous result (and any in-flight run).
  useEffect(() => {
    if (!meta.isKdf) return;
    runId.current++;
    setOutput("");
    setError(null);
    setComputing(false);
  }, [options, meta.isKdf]);

  async function generate() {
    const id = ++runId.current;
    setComputing(true);
    setError(null);
    const result = await hash(options);
    if (id !== runId.current) return;
    setComputing(false);
    if (result.ok) {
      setOutput(result.value);
    } else {
      setOutput("");
      setError(result.error);
    }
  }

  function loadSample() {
    // PBKDF2 / scrypt require an explicit salt; bcrypt / Argon2 auto-generate one.
    const needsSalt = meta.id === "pbkdf2" || meta.id === "scrypt";
    update({
      input: SAMPLE,
      salt: needsSalt && options.salt === "" ? "example-salt" : options.salt,
    });
  }

  const banner: ReactNode = error ? (
    <StatusBanner kind="error">{error}</StatusBanner>
  ) : computing ? (
    <StatusBanner kind="info">
      Computing — {meta.label} is intentionally slow, this can take a moment…
    </StatusBanner>
  ) : options.input === "" ? (
    <StatusBanner kind="info">
      Ready when you are — type or paste to begin. Runs 100% in your browser.
    </StatusBanner>
  ) : meta.isKdf && output === "" ? (
    <StatusBanner kind="info">
      Press <span className="font-medium">Generate</span> to derive the key.
    </StatusBanner>
  ) : output !== "" ? (
    <StatusBanner kind="validated">
      Looks good — {meta.label}
      {meta.supportsHmac && options.hmac ? " (HMAC)" : ""} computed.
    </StatusBanner>
  ) : (
    <StatusBanner kind="info">
      Ready when you are — type or paste to begin. Runs 100% in your browser.
    </StatusBanner>
  );

  return (
    <ToolLayout
      title="Hash Generator"
      description="Generate hashes, HMACs, and derived keys (MD5, SHA, BLAKE, PBKDF2, bcrypt, Argon2) — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Algorithm</span>
          <Select
            aria-label="Algorithm"
            value={options.algorithm}
            onChange={(e) => changeAlgorithm(e.target.value as AlgorithmId)}
          >
            <optgroup label="Digest / MAC">
              {algorithms
                .filter((a) => a.group === "Digest")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Key derivation (slow)">
              {algorithms
                .filter((a) => a.group === "KDF")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
            </optgroup>
          </Select>
        </label>

        <Segmented
          aria-label="HMAC"
          options={[
            { label: "Plain", value: "plain" },
            {
              label: "HMAC",
              value: "hmac",
              hint: "Keyed-hash MAC: combines the message with a secret key (RFC 2104).",
            },
          ]}
          value={options.hmac ? "hmac" : "plain"}
          onChange={(v) => update({ hmac: v === "hmac" })}
          disabled={!meta.supportsHmac}
          disabledReason={`HMAC applies to the standard digest algorithms — not ${meta.label}.`}
        />

        <Segmented
          aria-label="Output encoding"
          options={[
            { label: "Hex", value: "hex" },
            { label: "Base64", value: "base64" },
          ]}
          value={options.encoding}
          onChange={(v) => update({ encoding: v })}
          disabled={meta.fixedEncoding}
          disabledReason={`${meta.label} returns its own canonical encoded string.`}
        />

        <div className="ml-auto flex items-center gap-2">
          {meta.isKdf && (
            <Button
              size="sm"
              onClick={generate}
              disabled={computing || options.input === ""}
            >
              {computing ? "Generating…" : "Generate"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadSample}>
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update({ input: "" })}
            disabled={options.input === ""}
          >
            Clear
          </Button>
        </div>
      </div>

      {(showKey || meta.isKdf || meta.variableLength) && (
        <div className="flex flex-wrap items-end gap-3">
          {showKey && (
            <Field
              label={meta.supportsHmac && options.hmac ? "HMAC key" : "Key"}
              hint={
                meta.id === "blake3"
                  ? "Optional. When provided, must be exactly 32 bytes."
                  : meta.id === "blake2b"
                    ? "Optional keyed mode. Up to 64 bytes."
                    : "Secret key for the HMAC."
              }
            >
              <Input
                className="w-56"
                value={options.key}
                onChange={(e) => update({ key: e.target.value })}
                placeholder={meta.supportsKey ? "optional" : "secret key"}
              />
            </Field>
          )}

          {meta.isKdf && (
            <Field
              label="Salt"
              hint={
                meta.id === "bcrypt"
                  ? "Exactly 16 bytes. Leave empty to auto-generate a random salt."
                  : meta.id === "argon2id"
                    ? "Leave empty to auto-generate a random salt (embedded in the output)."
                    : "Required. Use unique random bytes per password in real use."
              }
            >
              <Input
                className="w-56"
                value={options.salt}
                onChange={(e) => update({ salt: e.target.value })}
                placeholder={
                  meta.id === "bcrypt" || meta.id === "argon2id"
                    ? "optional — random if empty"
                    : "required"
                }
              />
            </Field>
          )}

          {meta.variableLength && (
            <Field
              label="Length (bytes)"
              hint={`Output size, ${meta.minLengthBytes}–${meta.maxLengthBytes} bytes.`}
            >
              <Input
                type="number"
                className="w-28"
                min={meta.minLengthBytes}
                max={meta.maxLengthBytes}
                value={options.lengthBytes}
                onChange={(e) => update({ lengthBytes: Number(e.target.value) })}
              />
            </Field>
          )}

          {meta.id === "pbkdf2" && (
            <>
              <Field label="Iterations" hint="Higher is slower and stronger.">
                <Input
                  type="number"
                  className="w-32"
                  min={1}
                  value={options.iterations}
                  onChange={(e) =>
                    update({ iterations: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="PRF" hint="Underlying HMAC hash function.">
                <Select
                  aria-label="PBKDF2 PRF"
                  value={options.pbkdf2Prf}
                  onChange={(e) =>
                    update({ pbkdf2Prf: e.target.value as Pbkdf2Prf })
                  }
                >
                  <option value="sha1">HMAC-SHA1</option>
                  <option value="sha256">HMAC-SHA256</option>
                  <option value="sha512">HMAC-SHA512</option>
                </Select>
              </Field>
            </>
          )}

          {meta.id === "scrypt" && (
            <>
              <Field label="N (cost)" hint="CPU/memory cost — must be a power of two.">
                <Input
                  type="number"
                  className="w-28"
                  min={2}
                  value={options.scryptN}
                  onChange={(e) => update({ scryptN: Number(e.target.value) })}
                />
              </Field>
              <Field label="r (block)" hint="Block size.">
                <Input
                  type="number"
                  className="w-24"
                  min={1}
                  value={options.scryptR}
                  onChange={(e) => update({ scryptR: Number(e.target.value) })}
                />
              </Field>
              <Field label="p (parallel)" hint="Degree of parallelism.">
                <Input
                  type="number"
                  className="w-24"
                  min={1}
                  value={options.parallelism}
                  onChange={(e) =>
                    update({ parallelism: Number(e.target.value) })
                  }
                />
              </Field>
            </>
          )}

          {meta.id === "bcrypt" && (
            <Field label="Cost" hint="Work factor, 4–31. Each step doubles the work.">
              <Input
                type="number"
                className="w-24"
                min={4}
                max={31}
                value={options.bcryptCost}
                onChange={(e) => update({ bcryptCost: Number(e.target.value) })}
              />
            </Field>
          )}

          {meta.id === "argon2id" && (
            <>
              <Field label="Iterations" hint="Time cost (passes).">
                <Input
                  type="number"
                  className="w-24"
                  min={1}
                  value={options.iterations}
                  onChange={(e) =>
                    update({ iterations: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Memory (KiB)" hint="Memory cost in kibibytes.">
                <Input
                  type="number"
                  className="w-28"
                  min={8}
                  value={options.argonMemoryKiB}
                  onChange={(e) =>
                    update({ argonMemoryKiB: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Parallelism" hint="Number of parallel lanes.">
                <Input
                  type="number"
                  className="w-24"
                  min={1}
                  value={options.parallelism}
                  onChange={(e) =>
                    update({ parallelism: Number(e.target.value) })
                  }
                />
              </Field>
            </>
          )}
        </div>
      )}

      {banner}

      <ToolPanes>
        <ToolPane label={meta.isKdf ? "Password / message" : "Input"}>
          <CodeEditor
            value={options.input}
            onChange={(value) => update({ input: value })}
            placeholder="Type or paste text…"
            minHeight="30vh"
          />
        </ToolPane>
        <ToolPane
          label={meta.isKdf ? "Derived key" : "Hash"}
          actions={<CopyButton value={output} />}
        >
          <CodeEditor value={output} readOnly minHeight="30vh" />
        </ToolPane>
      </ToolPanes>
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
