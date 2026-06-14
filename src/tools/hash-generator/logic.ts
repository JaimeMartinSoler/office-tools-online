import {
  argon2id,
  bcrypt,
  blake2b,
  blake3,
  createHMAC,
  createMD5,
  createRIPEMD160,
  createSHA1,
  createSHA256,
  createSHA384,
  createSHA512,
  createSHA3,
  crc32,
  md5,
  pbkdf2,
  ripemd160,
  scrypt,
  sha1,
  sha256,
  sha384,
  sha512,
  sha3,
  type IDataType,
  type IHasher,
} from "hash-wasm";
import { err, ok, type Result } from "@/lib/result";

export type AlgorithmId =
  | "md5"
  | "sha1"
  | "sha256"
  | "sha384"
  | "sha512"
  | "sha3-256"
  | "sha3-512"
  | "ripemd160"
  | "crc32"
  | "blake2b"
  | "blake3"
  | "pbkdf2"
  | "scrypt"
  | "bcrypt"
  | "argon2id";

export type AlgorithmGroup = "Digest" | "KDF";

export type Encoding = "hex" | "base64";

export interface AlgorithmMeta {
  id: AlgorithmId;
  label: string;
  group: AlgorithmGroup;
  /** Can be wrapped in HMAC with a secret key. */
  supportsHmac: boolean;
  /** Has a native keyed mode (BLAKE2b / BLAKE3). */
  supportsKey: boolean;
  /** Output length (in bytes) is configurable. */
  variableLength: boolean;
  /** A slow, salted key-derivation function (uses the explicit Generate button). */
  isKdf: boolean;
  /** Produces its own canonical encoded string — the hex/Base64 toggle does not apply. */
  fixedEncoding: boolean;
  /** Default / bounds for the configurable output length, in bytes. */
  defaultLengthBytes?: number;
  minLengthBytes?: number;
  maxLengthBytes?: number;
}

function digest(id: AlgorithmId, label: string): AlgorithmMeta {
  return {
    id,
    label,
    group: "Digest",
    supportsHmac: true,
    supportsKey: false,
    variableLength: false,
    isKdf: false,
    fixedEncoding: false,
  };
}

function kdf(id: AlgorithmId, label: string): AlgorithmMeta {
  return {
    id,
    label,
    group: "KDF",
    supportsHmac: false,
    supportsKey: false,
    variableLength: true,
    isKdf: true,
    fixedEncoding: false,
    defaultLengthBytes: 32,
    minLengthBytes: 1,
    maxLengthBytes: 64,
  };
}

export const algorithms: AlgorithmMeta[] = [
  digest("md5", "MD5"),
  digest("sha1", "SHA-1"),
  digest("sha256", "SHA-256"),
  digest("sha384", "SHA-384"),
  digest("sha512", "SHA-512"),
  digest("sha3-256", "SHA3-256"),
  digest("sha3-512", "SHA3-512"),
  digest("ripemd160", "RIPEMD-160"),
  { ...digest("crc32", "CRC32"), supportsHmac: false },
  {
    id: "blake2b",
    label: "BLAKE2b",
    group: "Digest",
    supportsHmac: false,
    supportsKey: true,
    variableLength: true,
    isKdf: false,
    fixedEncoding: false,
    defaultLengthBytes: 64,
    minLengthBytes: 1,
    maxLengthBytes: 64,
  },
  {
    id: "blake3",
    label: "BLAKE3",
    group: "Digest",
    supportsHmac: false,
    supportsKey: true,
    variableLength: true,
    isKdf: false,
    fixedEncoding: false,
    defaultLengthBytes: 32,
    minLengthBytes: 1,
    maxLengthBytes: 128,
  },
  kdf("pbkdf2", "PBKDF2"),
  kdf("scrypt", "scrypt"),
  { ...kdf("bcrypt", "bcrypt"), fixedEncoding: true, variableLength: false },
  { ...kdf("argon2id", "Argon2id"), fixedEncoding: true },
];

export function getAlgorithm(id: AlgorithmId): AlgorithmMeta {
  const meta = algorithms.find((a) => a.id === id);
  if (!meta) throw new Error(`Unknown algorithm: ${id}`);
  return meta;
}

/** PRF choices for PBKDF2. */
export type Pbkdf2Prf = "sha1" | "sha256" | "sha512";

export interface HashOptions {
  algorithm: AlgorithmId;
  input: string;
  encoding: Encoding;
  /** Wrap a digest in HMAC (only honored when the algorithm supportsHmac). */
  hmac: boolean;
  /** HMAC secret or native BLAKE key. */
  key: string;
  /** KDF salt. */
  salt: string;
  /** Output length in bytes for variable-length algorithms and KDFs. */
  lengthBytes: number;
  /** PBKDF2 / Argon2 iteration count. */
  iterations: number;
  /** PBKDF2 underlying PRF. */
  pbkdf2Prf: Pbkdf2Prf;
  /** scrypt CPU/memory cost N (power of two). */
  scryptN: number;
  /** scrypt block size r. */
  scryptR: number;
  /** scrypt / Argon2 parallelism p. */
  parallelism: number;
  /** bcrypt cost factor (4–31). */
  bcryptCost: number;
  /** Argon2 memory in KiB. */
  argonMemoryKiB: number;
}

export const DEFAULT_OPTIONS: HashOptions = {
  algorithm: "sha256",
  input: "",
  encoding: "hex",
  hmac: false,
  key: "",
  salt: "",
  lengthBytes: 32,
  iterations: 100_000,
  pbkdf2Prf: "sha256",
  scryptN: 16_384,
  scryptR: 8,
  parallelism: 1,
  bcryptCost: 10,
  argonMemoryKiB: 4096,
};

const digestFactories: Record<string, () => Promise<IHasher>> = {
  md5: createMD5,
  sha1: createSHA1,
  sha256: createSHA256,
  sha384: createSHA384,
  sha512: createSHA512,
  "sha3-256": () => createSHA3(256),
  "sha3-512": () => createSHA3(512),
  ripemd160: createRIPEMD160,
};

const oneShot: Partial<Record<AlgorithmId, (data: IDataType) => Promise<string>>> =
  {
    md5,
    sha1,
    sha256,
    sha384,
    sha512,
    "sha3-256": (d) => sha3(d, 256),
    "sha3-512": (d) => sha3(d, 512),
    ripemd160,
    crc32,
  };

/**
 * Computes a hash / MAC / derived key for the given input, entirely in-browser.
 * Returns a `Result` rather than throwing so the UI can surface bad input.
 *
 * Note: bcrypt and Argon2id generate a random salt when none is supplied (the
 * salt is embedded in the returned encoded string), so those calls are
 * non-deterministic by design.
 */
export async function hash(options: HashOptions): Promise<Result<string>> {
  const meta = getAlgorithm(options.algorithm);
  try {
    if (meta.isKdf) return await runKdf(meta.id, options);
    const hex = await runDigest(meta, options);
    return ok(encodeHex(hex, options.encoding));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(message);
  }
}

async function runDigest(
  meta: AlgorithmMeta,
  options: HashOptions,
): Promise<string> {
  const { id } = meta;
  const { input } = options;

  // HMAC wraps any of the standard digest functions with a secret key.
  if (meta.supportsHmac && options.hmac) {
    if (options.key === "") throw new Error("HMAC requires a key.");
    const factory = digestFactories[id];
    if (!factory) throw new Error(`HMAC is not supported for ${meta.label}.`);
    const hasher = await createHMAC(factory(), options.key);
    hasher.init();
    hasher.update(input);
    return hasher.digest("hex");
  }

  if (id === "blake2b") {
    const bits = validateLength(meta, options.lengthBytes) * 8;
    return blake2b(input, bits, options.key || undefined);
  }
  if (id === "blake3") {
    const bits = validateLength(meta, options.lengthBytes) * 8;
    // BLAKE3's optional key must be exactly 32 bytes.
    let key: Uint8Array | undefined;
    if (options.key !== "") {
      const bytes = new TextEncoder().encode(options.key);
      if (bytes.length !== 32) {
        throw new Error("BLAKE3 key must be exactly 32 bytes when provided.");
      }
      key = bytes;
    }
    return blake3(input, bits, key);
  }

  const fn = oneShot[id];
  if (!fn) throw new Error(`Unsupported algorithm: ${id}`);
  return fn(input);
}

async function runKdf(
  id: AlgorithmId,
  options: HashOptions,
): Promise<Result<string>> {
  const meta = getAlgorithm(id);
  const password = options.input;

  if (id === "bcrypt") {
    const salt = bcryptSalt(options.salt);
    if (!salt.ok) return salt;
    const encoded = await bcrypt({
      password,
      salt: salt.value,
      costFactor: clampInt(options.bcryptCost, 4, 31),
      outputType: "encoded",
    });
    return ok(encoded);
  }

  if (id === "argon2id") {
    const encoded = await argon2id({
      password,
      salt: requiredOrRandomSalt(options.salt),
      iterations: Math.max(1, Math.floor(options.iterations || 3)),
      parallelism: Math.max(1, Math.floor(options.parallelism)),
      memorySize: Math.max(8, Math.floor(options.argonMemoryKiB)),
      hashLength: validateLength(meta, options.lengthBytes),
      outputType: "encoded",
    });
    return ok(encoded);
  }

  // PBKDF2 and scrypt need an explicit salt and emit a raw derived key.
  if (options.salt === "") {
    return err(`Salt is required for ${meta.label}.`);
  }
  const hashLength = validateLength(meta, options.lengthBytes);

  if (id === "pbkdf2") {
    const hex = await pbkdf2({
      password,
      salt: options.salt,
      iterations: Math.max(1, Math.floor(options.iterations)),
      hashLength,
      hashFunction: digestFactories[options.pbkdf2Prf]!(),
    });
    return ok(encodeHex(hex, options.encoding));
  }

  // scrypt
  const n = options.scryptN;
  if (n < 2 || (n & (n - 1)) !== 0) {
    return err("scrypt cost factor (N) must be a power of two.");
  }
  const hex = await scrypt({
    password,
    salt: options.salt,
    costFactor: n,
    blockSize: Math.max(1, Math.floor(options.scryptR)),
    parallelism: Math.max(1, Math.floor(options.parallelism)),
    hashLength,
  });
  return ok(encodeHex(hex, options.encoding));
}

function validateLength(meta: AlgorithmMeta, lengthBytes: number): number {
  const min = meta.minLengthBytes ?? 1;
  const max = meta.maxLengthBytes ?? 64;
  const value = Math.floor(lengthBytes);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Output length must be between ${min} and ${max} bytes.`);
  }
  return value;
}

function bcryptSalt(salt: string): Result<Uint8Array> {
  if (salt === "") return ok(randomBytes(16));
  const bytes = new TextEncoder().encode(salt);
  if (bytes.length !== 16) {
    return err(
      `bcrypt salt must be exactly 16 bytes (got ${bytes.length}). Leave it empty to auto-generate one.`,
    );
  }
  return ok(bytes);
}

function requiredOrRandomSalt(salt: string): Uint8Array | string {
  return salt === "" ? randomBytes(16) : salt;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function encodeHex(hex: string, encoding: Encoding): string {
  if (encoding === "hex") return hex;
  return bytesToBase64(hexToBytes(hex));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
