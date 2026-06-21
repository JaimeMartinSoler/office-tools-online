import { err, ok, type Result } from "@/lib/result";

export type IdKind = "uuidv4" | "uuidv7" | "ulid";

export const ID_KINDS: IdKind[] = ["uuidv4", "uuidv7", "ulid"];

export const KIND_LABELS: Record<IdKind, string> = {
  uuidv4: "UUID v4",
  uuidv7: "UUID v7",
  ulid: "ULID",
};

export interface GenerateOptions {
  kind: IdKind;
  count: number;
  /** Uppercase the output (hex for UUIDs; ULIDs are already upper Crockford). */
  uppercase: boolean;
  /** Wrap UUIDs in braces, e.g. {xxxxxxxx-...}. Ignored for ULIDs. */
  braces: boolean;
}

export const DEFAULT_OPTIONS: GenerateOptions = {
  kind: "uuidv4",
  count: 5,
  uppercase: false,
  braces: false,
};

export const MAX_COUNT = 1000;

/** A source of `n` random bytes; defaults to the Web Crypto CSPRNG. */
export type RandomBytes = (n: number) => Uint8Array;

export function cryptoBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Format 16 bytes as the canonical 8-4-4-4-12 hyphenated UUID string. */
function formatUuid(bytes: Uint8Array): string {
  const h = toHex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Random version-4 UUID (RFC 4122). */
export function uuidV4(rand: RandomBytes = cryptoBytes): string {
  const bytes = rand(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10
  return formatUuid(bytes);
}

/**
 * Time-ordered version-7 UUID (RFC 9562): a 48-bit Unix-millisecond timestamp
 * followed by version/variant bits and randomness.
 */
export function uuidV7(timeMs: number, rand: RandomBytes = cryptoBytes): string {
  const bytes = rand(16);
  const ts = Math.floor(timeMs);
  // 48-bit big-endian timestamp in the first 6 bytes.
  bytes[0] = (ts / 0x10000000000) & 0xff;
  bytes[1] = (ts / 0x100000000) & 0xff;
  bytes[2] = (ts / 0x1000000) & 0xff;
  bytes[3] = (ts / 0x10000) & 0xff;
  bytes[4] = (ts / 0x100) & 0xff;
  bytes[5] = ts & 0xff;
  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10
  return formatUuid(bytes);
}

/** Crockford's base32 alphabet (excludes I, L, O, U). */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Encode a non-negative integer as `length` Crockford base32 characters. */
function encodeTime(timeMs: number, length: number): string {
  let value = Math.floor(timeMs);
  let out = "";
  for (let i = 0; i < length; i++) {
    out = CROCKFORD[value % 32]! + out;
    value = Math.floor(value / 32);
  }
  return out;
}

/**
 * ULID: a 26-character Crockford base32 string — 10 characters of millisecond
 * timestamp followed by 16 characters (80 bits) of randomness.
 */
export function ulid(timeMs: number, rand: RandomBytes = cryptoBytes): string {
  const time = encodeTime(timeMs, 10);
  // 16 base32 chars carry 80 bits; draw 80 random bits as 16 5-bit groups.
  const bytes = rand(10);
  let bits = 0n;
  for (const b of bytes) bits = (bits << 8n) | BigInt(b);
  let random = "";
  for (let i = 0; i < 16; i++) {
    random = CROCKFORD[Number(bits & 31n)]! + random;
    bits >>= 5n;
  }
  return time + random;
}

function decorateUuid(value: string, options: GenerateOptions): string {
  let out = options.uppercase ? value.toUpperCase() : value;
  if (options.braces) out = `{${out}}`;
  return out;
}

/**
 * Generate `count` identifiers of the chosen kind. Pure given `now` and `rand`
 * so tests can pin the timestamp and randomness.
 */
export function generate(
  options: GenerateOptions,
  now: number,
  rand: RandomBytes = cryptoBytes,
): Result<string[]> {
  if (!Number.isInteger(options.count) || options.count < 1) {
    return err("Count must be a whole number of at least 1.");
  }
  if (options.count > MAX_COUNT) {
    return err(`Count must be ${MAX_COUNT} or fewer.`);
  }

  const out: string[] = [];
  for (let i = 0; i < options.count; i++) {
    switch (options.kind) {
      case "uuidv4":
        out.push(decorateUuid(uuidV4(rand), options));
        break;
      case "uuidv7":
        out.push(decorateUuid(uuidV7(now, rand), options));
        break;
      case "ulid": {
        // ULIDs are canonically uppercase Crockford base32.
        const value = ulid(now, rand);
        out.push(options.uppercase ? value : value.toLowerCase());
        break;
      }
    }
  }
  return ok(out);
}
