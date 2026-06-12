import { err, ok, type Result } from "@/lib/result";

export type Base64Variant = "standard" | "url";

/** Encode raw bytes to Base64 (or Base64URL). */
export function bytesToBase64(
  bytes: Uint8Array,
  variant: Base64Variant,
): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  let base64 = btoa(binary);
  if (variant === "url") {
    base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return base64;
}

function base64ToBytes(input: string, variant: Base64Variant): Uint8Array {
  let normalized = input.replace(/\s+/g, "");
  if (variant === "url") {
    normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
  }
  const padding = normalized.length % 4;
  if (padding > 0) {
    normalized = normalized.padEnd(normalized.length + (4 - padding), "=");
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode UTF-8 text to Base64. */
export function encodeText(
  input: string,
  variant: Base64Variant,
): Result<string> {
  try {
    return ok(bytesToBase64(new TextEncoder().encode(input), variant));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not encode: ${message}`);
  }
}

/** Decode Base64 to UTF-8 text. Returns an error for malformed input. */
export function decodeText(
  input: string,
  variant: Base64Variant,
): Result<string> {
  if (input.trim() === "") return err("Input is empty.");
  try {
    const bytes = base64ToBytes(input, variant);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return ok(text);
  } catch {
    return err("Invalid Base64 input.");
  }
}
