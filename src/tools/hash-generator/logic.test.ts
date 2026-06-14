import { describe, expect, it } from "vitest";
import { DEFAULT_OPTIONS, hash, type HashOptions } from "./logic";

function opts(overrides: Partial<HashOptions>): HashOptions {
  return { ...DEFAULT_OPTIONS, ...overrides };
}

async function value(overrides: Partial<HashOptions>): Promise<string> {
  const result = await hash(opts(overrides));
  if (!result.ok) throw new Error(`expected ok, got error: ${result.error}`);
  return result.value;
}

describe("digests (known-answer vectors)", () => {
  it("MD5 of empty string", async () => {
    expect(await value({ algorithm: "md5", input: "" })).toBe(
      "d41d8cd98f00b204e9800998ecf8427e",
    );
  });

  it("SHA-1 of 'abc'", async () => {
    expect(await value({ algorithm: "sha1", input: "abc" })).toBe(
      "a9993e364706816aba3e25717850c26c9cd0d89d",
    );
  });

  it("SHA-256 of 'abc'", async () => {
    expect(await value({ algorithm: "sha256", input: "abc" })).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("SHA3-256 of empty string", async () => {
    expect(await value({ algorithm: "sha3-256", input: "" })).toBe(
      "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
    );
  });

  it("RIPEMD-160 of 'abc'", async () => {
    expect(await value({ algorithm: "ripemd160", input: "abc" })).toBe(
      "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc",
    );
  });

  it("CRC32 of '123456789'", async () => {
    expect(await value({ algorithm: "crc32", input: "123456789" })).toBe(
      "cbf43926",
    );
  });
});

describe("output encoding", () => {
  it("encodes SHA-256 as Base64", async () => {
    // Base64 of the SHA-256("abc") digest above.
    expect(
      await value({ algorithm: "sha256", input: "abc", encoding: "base64" }),
    ).toBe("ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=");
  });
});

describe("variable length (BLAKE)", () => {
  it("BLAKE2b honors a custom output length", async () => {
    const out = await value({
      algorithm: "blake2b",
      input: "abc",
      lengthBytes: 32,
    });
    expect(out).toHaveLength(64); // 32 bytes => 64 hex chars
  });

  it("BLAKE3 default is 32 bytes for 'abc'", async () => {
    expect(
      await value({ algorithm: "blake3", input: "abc", lengthBytes: 32 }),
    ).toBe(
      "6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85",
    );
  });

  it("rejects an out-of-range length", async () => {
    const result = await hash(
      opts({ algorithm: "blake2b", input: "abc", lengthBytes: 999 }),
    );
    expect(result.ok).toBe(false);
  });
});

describe("HMAC", () => {
  it("HMAC-SHA256 (RFC 4231 test case 1)", async () => {
    // key = 20 bytes of 0x0b, data = "Hi There"
    const key = "\x0b".repeat(20);
    expect(
      await value({ algorithm: "sha256", input: "Hi There", hmac: true, key }),
    ).toBe("b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7");
  });

  it("errors when HMAC is enabled without a key", async () => {
    const result = await hash(
      opts({ algorithm: "sha256", input: "abc", hmac: true, key: "" }),
    );
    expect(result.ok).toBe(false);
  });
});

describe("KDFs", () => {
  it("PBKDF2-HMAC-SHA1 (RFC 6070 test case 2)", async () => {
    expect(
      await value({
        algorithm: "pbkdf2",
        input: "password",
        salt: "salt",
        iterations: 2,
        lengthBytes: 20,
        pbkdf2Prf: "sha1",
      }),
    ).toBe("ea6c014dc72d6f8ccd1ed92ace1d41f0d8de8957");
  });

  it("requires a salt for PBKDF2", async () => {
    const result = await hash(
      opts({ algorithm: "pbkdf2", input: "password", salt: "" }),
    );
    expect(result.ok).toBe(false);
  });

  it("scrypt rejects a non-power-of-two cost factor", async () => {
    const result = await hash(
      opts({
        algorithm: "scrypt",
        input: "password",
        salt: "NaCl",
        scryptN: 1000,
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("bcrypt produces a verifiable encoded hash", async () => {
    const out = await value({
      algorithm: "bcrypt",
      input: "password",
      salt: "",
      bcryptCost: 4,
    });
    expect(out).toMatch(/^\$2[aby]\$04\$/);
  });

  it("bcrypt rejects a salt that is not 16 bytes", async () => {
    const result = await hash(
      opts({ algorithm: "bcrypt", input: "password", salt: "short" }),
    );
    expect(result.ok).toBe(false);
  });

  it("Argon2id produces a PHC-encoded hash", async () => {
    const out = await value({
      algorithm: "argon2id",
      input: "password",
      salt: "somesalt",
      iterations: 2,
      argonMemoryKiB: 256,
      parallelism: 1,
      lengthBytes: 32,
    });
    expect(out).toMatch(/^\$argon2id\$/);
  });
});
