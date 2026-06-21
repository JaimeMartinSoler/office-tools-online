"use client";

import { CheckCircle2, ShieldAlert, ShieldX } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CopyButton } from "@/components/copy-button";
import { StatusBanner } from "@/components/status-banner";
import { ToolLayout, ToolPane, ToolPanes } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialSample } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  decodeJwt,
  describeClaims,
  evaluateValidity,
  isHsAlgorithm,
  verifyHmac,
  type ExpiryState,
} from "./logic";

// The jwt.io example token — verifies with the secret "your-256-bit-secret".
const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ" +
  ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const VALIDITY_KIND: Record<ExpiryState, "validated" | "warning" | "error" | "info"> = {
  valid: "validated",
  expired: "error",
  "not-yet-valid": "warning",
  "no-expiry": "info",
};

type VerifyResult =
  | { status: "idle" }
  | { status: "valid" }
  | { status: "invalid" }
  | { status: "error"; message: string };

export function JwtInspectorTool() {
  const [token, setToken] = useState(() => initialSample(SAMPLE));
  const [secret, setSecret] = useState("");

  const decoded = useMemo(() => {
    if (token.trim() === "") return null;
    return decodeJwt(token);
  }, [token]);

  const ok = decoded?.ok ? decoded.value : null;
  const claims = ok ? describeClaims(ok.payloadObject) : [];
  const validity = ok ? evaluateValidity(ok.payloadObject, Date.now()) : null;
  const alg = ok ? ok.headerObject.alg : undefined;
  const canVerify = isHsAlgorithm(alg);

  const [verify, setVerify] = useState<VerifyResult>({ status: "idle" });

  // Re-verify (debounced) whenever the token or secret changes.
  useEffect(() => {
    if (!ok || !canVerify || secret === "") {
      setVerify({ status: "idle" });
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      void verifyHmac(ok, secret).then((result) => {
        if (cancelled) return;
        if (!result.ok) setVerify({ status: "error", message: result.error });
        else setVerify({ status: result.value ? "valid" : "invalid" });
      });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [ok, canVerify, secret]);

  return (
    <ToolLayout
      title="JWT Inspector"
      description="Decode a JSON Web Token's header and payload, inspect its claims and expiry, and verify HS256/384/512 signatures — entirely in your browser."
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setToken(SAMPLE)}>
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToken("")}
            disabled={token === ""}
          >
            Clear
          </Button>
        </div>
      </div>

      {decoded && !decoded.ok ? (
        <StatusBanner kind="error">{decoded.error}</StatusBanner>
      ) : token.trim() === "" ? (
        <StatusBanner kind="info">
          Paste a JWT to decode its header and payload. Nothing leaves your browser.
        </StatusBanner>
      ) : validity ? (
        <StatusBanner kind={VALIDITY_KIND[validity.state]}>
          {validity.message}
        </StatusBanner>
      ) : null}

      <ToolPanes>
        <ToolPane label="Encoded token">
          <CodeEditor
            value={token}
            onChange={setToken}
            placeholder="Paste a JWT (header.payload.signature)…"
            autoHeight
          />
        </ToolPane>
        <ToolPane
          label="Payload"
          actions={<CopyButton value={ok?.payload ?? ""} />}
        >
          <CodeEditor value={ok?.payload ?? ""} language="json" readOnly />
        </ToolPane>
      </ToolPanes>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPane
          label="Header"
          actions={<CopyButton value={ok?.header ?? ""} />}
        >
          <CodeEditor
            value={ok?.header ?? ""}
            language="json"
            readOnly
            minHeight="20vh"
          />
        </ToolPane>

        <ToolPane label="Claims">
          <div className="min-h-[20vh] overflow-auto rounded-md border bg-card p-1">
            {claims.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                Decoded claims appear here.
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {claims.map((claim) => (
                    <tr
                      key={claim.key}
                      className="border-b border-border/50 align-top last:border-b-0"
                    >
                      <td className="py-1.5 pl-3 pr-3 font-mono text-muted-foreground">
                        {claim.key}
                        {claim.label !== claim.key && (
                          <span className="ml-1 text-xs">({claim.label})</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 font-mono break-all">
                        {typeof claim.raw === "object"
                          ? JSON.stringify(claim.raw)
                          : String(claim.raw)}
                        {claim.detail && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {claim.detail}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ToolPane>
      </div>

      <ToolPane label="Verify signature">
        <div className="space-y-3 rounded-md border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            {canVerify
              ? `Enter the shared secret to check this ${String(alg)} signature. Verification runs locally — the secret never leaves your browser.`
              : ok
                ? `Signature verification here supports HS256/384/512 only. This token uses "${String(alg)}".`
                : "Decode a token to verify its signature."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder='HMAC secret (sample uses "your-256-bit-secret")'
              className="max-w-md font-mono"
              disabled={!canVerify}
              spellCheck={false}
              aria-label="HMAC secret"
            />
            <VerifyBadge result={verify} hasSecret={secret !== ""} />
          </div>
        </div>
      </ToolPane>
    </ToolLayout>
  );
}

function VerifyBadge({
  result,
  hasSecret,
}: {
  result: VerifyResult;
  hasSecret: boolean;
}) {
  if (result.status === "valid") {
    return (
      <Badge className="border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-500">
        <CheckCircle2 className="size-4" />
        Signature verified
      </Badge>
    );
  }
  if (result.status === "invalid") {
    return (
      <Badge className="border-destructive/40 bg-destructive/10 text-destructive">
        <ShieldX className="size-4" />
        Signature mismatch
      </Badge>
    );
  }
  if (result.status === "error") {
    return (
      <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-500">
        <ShieldAlert className="size-4" />
        {result.message}
      </Badge>
    );
  }
  return hasSecret ? null : (
    <span className="text-sm text-muted-foreground">Awaiting secret…</span>
  );
}

function Badge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
