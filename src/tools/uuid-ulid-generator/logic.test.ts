import { describe, expect, it } from "vitest";
import {
  generate,
  ulid,
  uuidV4,
  uuidV7,
  type RandomBytes,
} from "./logic";

/** Deterministic byte source: fills with a constant value. */
const constBytes =
  (fill: number): RandomBytes =>
  (n: number) =>
    new Uint8Array(n).fill(fill);

describe("uuidV4", () => {
  it("sets the version and variant bits", () => {
    const id = uuidV4(constBytes(0xff));
    // 8-4-4-4-12 shape.
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(id[14]).toBe("4"); // version nibble
    expect("89ab").toContain(id[19]); // variant nibble
  });

  it("is random across calls", () => {
    expect(uuidV4()).not.toBe(uuidV4());
  });
});

describe("uuidV7", () => {
  it("encodes the timestamp in the high bytes and tags version 7", () => {
    const ms = 0x017f22e279b0; // an arbitrary 48-bit millisecond value
    const id = uuidV7(ms, constBytes(0));
    expect(id.replace(/-/g, "").slice(0, 12)).toBe("017f22e279b0");
    expect(id[14]).toBe("7"); // version nibble
    expect("89ab").toContain(id[19]); // variant nibble
  });

  it("orders lexically by time", () => {
    const a = uuidV7(1000, constBytes(0));
    const b = uuidV7(2000, constBytes(0));
    expect(a < b).toBe(true);
  });
});

describe("ulid", () => {
  it("is 26 Crockford base32 characters", () => {
    const id = ulid(1700000000000, constBytes(0));
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("orders lexically by time", () => {
    const a = ulid(1000, constBytes(0));
    const b = ulid(2000, constBytes(0));
    expect(a < b).toBe(true);
  });
});

describe("generate", () => {
  it("produces the requested count", () => {
    const result = generate(
      { kind: "uuidv4", count: 3, uppercase: false, braces: false },
      0,
      constBytes(0x10),
    );
    expect(result.ok && result.value).toHaveLength(3);
  });

  it("applies uppercase and braces to UUIDs", () => {
    const result = generate(
      { kind: "uuidv4", count: 1, uppercase: true, braces: true },
      0,
      constBytes(0xab),
    );
    expect(result.ok && result.value[0]).toMatch(/^\{[0-9A-F-]+\}$/);
  });

  it("rejects out-of-range counts", () => {
    expect(
      generate({ kind: "ulid", count: 0, uppercase: false, braces: false }, 0)
        .ok,
    ).toBe(false);
    expect(
      generate(
        { kind: "ulid", count: 9999, uppercase: false, braces: false },
        0,
      ).ok,
    ).toBe(false);
  });

  it("lowercases ULIDs only when uppercase is off", () => {
    const lower = generate(
      { kind: "ulid", count: 1, uppercase: false, braces: false },
      0,
      constBytes(0),
    );
    const upper = generate(
      { kind: "ulid", count: 1, uppercase: true, braces: false },
      0,
      constBytes(0),
    );
    expect(lower.ok && lower.value[0]).toBe(
      upper.ok ? upper.value[0]!.toLowerCase() : "",
    );
  });
});
