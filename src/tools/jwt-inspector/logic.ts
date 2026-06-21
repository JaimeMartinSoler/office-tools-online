import { createHMAC, createSHA256, createSHA384, createSHA512 } from "hash-wasm";
import { err, ok, type Result } from "@/lib/result";

export interface DecodedJwt {
  /** Pretty-printed header JSON. */
  header: string;
  /** Pretty-printed payload JSON. */
  payload: string;
  /** Parsed header object (for reading `alg`/`typ`). */
  headerObject: Record<string, unknown>;
  /** Parsed payload object (for claim inspection). */
  payloadObject: Record<string, unknown>;
  /** The raw `header.payload` signing input. */
  signingInput: string;
  /** The base64url signature segment (empty for an unsigned token). */
  signature: string;
}

/** Decode a base64url string to bytes (tolerates missing padding). */
export function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encode bytes as an unpadded base64url string. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeSegment(segment: string, name: string): Result<unknown> {
  let json: string;
  try {
    json = new TextDecoder().decode(base64UrlToBytes(segment));
  } catch {
    return err(`The ${name} is not valid base64url.`);
  }
  try {
    return ok(JSON.parse(json));
  } catch {
    return err(`The ${name} is not valid JSON.`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Split and decode a JWT into its header and payload, without verifying it. */
export function decodeJwt(token: string): Result<DecodedJwt> {
  const trimmed = token.trim();
  if (trimmed === "") return err("Paste a JWT to inspect.");

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return err(
      `A JWT has three dot-separated parts, but this has ${parts.length}.`,
    );
  }
  const [headerSeg, payloadSeg, signature] = parts as [string, string, string];

  const header = decodeSegment(headerSeg, "header");
  if (!header.ok) return header;
  const payload = decodeSegment(payloadSeg, "payload");
  if (!payload.ok) return payload;

  if (!isPlainObject(header.value)) {
    return err("The header must be a JSON object.");
  }
  const payloadObject = isPlainObject(payload.value) ? payload.value : {};

  return ok({
    header: JSON.stringify(header.value, null, 2),
    payload: JSON.stringify(payload.value, null, 2),
    headerObject: header.value,
    payloadObject,
    signingInput: `${headerSeg}.${payloadSeg}`,
    signature,
  });
}

export interface Claim {
  key: string;
  label: string;
  raw: unknown;
  /** A human-readable interpretation (e.g. a formatted date), when applicable. */
  detail?: string;
}

const REGISTERED: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires",
  nbf: "Not before",
  iat: "Issued at",
  jti: "JWT ID",
};

/** A NumericDate claim formatted in UTC, or null when it isn't a number. */
function formatDate(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString().replace(".000Z", "Z");
}

/** Build the ordered claim list, annotating registered/date claims. */
export function describeClaims(payload: Record<string, unknown>): Claim[] {
  return Object.entries(payload).map(([key, raw]) => {
    const claim: Claim = { key, label: REGISTERED[key] ?? key, raw };
    if (key === "exp" || key === "nbf" || key === "iat") {
      const date = formatDate(raw);
      if (date) claim.detail = date;
    }
    return claim;
  });
}

export type ExpiryState = "valid" | "expired" | "not-yet-valid" | "no-expiry";

export interface Validity {
  state: ExpiryState;
  message: string;
}

/**
 * Evaluate `exp`/`nbf` against `now` (ms). Pure given `now` so it is testable.
 */
export function evaluateValidity(
  payload: Record<string, unknown>,
  now: number,
): Validity {
  const nowSec = now / 1000;
  const nbf = payload.nbf;
  if (typeof nbf === "number" && nowSec < nbf) {
    return {
      state: "not-yet-valid",
      message: `Not valid until ${formatDate(nbf)} (nbf is in the future).`,
    };
  }
  const exp = payload.exp;
  if (typeof exp === "number") {
    if (nowSec >= exp) {
      return { state: "expired", message: `Expired on ${formatDate(exp)}.` };
    }
    return { state: "valid", message: `Valid — expires ${formatDate(exp)}.` };
  }
  return { state: "no-expiry", message: "No expiry (exp) claim is present." };
}

export type HsAlgorithm = "HS256" | "HS384" | "HS512";

export function isHsAlgorithm(alg: unknown): alg is HsAlgorithm {
  return alg === "HS256" || alg === "HS384" || alg === "HS512";
}

const HS_FACTORY = {
  HS256: createSHA256,
  HS384: createSHA384,
  HS512: createSHA512,
};

/**
 * Verify an HMAC-signed (HS256/384/512) JWT against `secret`. Recomputes the
 * signature over the signing input and compares it to the token's signature.
 */
export async function verifyHmac(
  decoded: DecodedJwt,
  secret: string,
): Promise<Result<boolean>> {
  const alg = decoded.headerObject.alg;
  if (!isHsAlgorithm(alg)) {
    return err(
      `Verification supports HS256/384/512 only; this token's alg is "${String(alg)}".`,
    );
  }
  if (secret === "") return err("Enter the secret to verify the signature.");
  if (decoded.signature === "") return err("This token has no signature to verify.");

  const hasher = await createHMAC(HS_FACTORY[alg](), secret);
  hasher.init();
  hasher.update(decoded.signingInput);
  const expected = bytesToBase64Url(hasher.digest("binary"));
  return ok(expected === decoded.signature);
}
