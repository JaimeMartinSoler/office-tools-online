import { describe, expect, it } from "vitest";
import { bytesToBase64, decodeText, encodeText } from "./logic";

describe("encodeText", () => {
  it("encodes ASCII", () => {
    expect(encodeText("Hello", "standard")).toEqual({
      ok: true,
      value: "SGVsbG8=",
    });
  });

  it("round-trips unicode and emoji", () => {
    const input = "héllo 😀";
    const encoded = encodeText(input, "standard");
    expect(encoded.ok).toBe(true);
    if (encoded.ok) {
      expect(decodeText(encoded.value, "standard")).toEqual({
        ok: true,
        value: input,
      });
    }
  });

  it("uses URL-safe alphabet without padding", () => {
    expect(bytesToBase64(new Uint8Array([251, 255]), "url")).toBe("-_8");
    expect(bytesToBase64(new Uint8Array([251, 255]), "standard")).toBe("+/8=");
  });

  it("round-trips text with the url variant", () => {
    const input = "data?with/special+chars";
    const encoded = encodeText(input, "url");
    expect(encoded.ok && encoded.value).not.toContain("=");
    if (encoded.ok) {
      expect(decodeText(encoded.value, "url")).toEqual({
        ok: true,
        value: input,
      });
    }
  });
});

describe("decodeText", () => {
  it("decodes ASCII", () => {
    expect(decodeText("SGVsbG8=", "standard")).toEqual({
      ok: true,
      value: "Hello",
    });
  });

  it("decodes url variant without padding", () => {
    const encoded = encodeText("ready?", "url");
    expect(encoded.ok && decodeText(encoded.value, "url").ok).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(decodeText("!!!not base64!!!", "standard").ok).toBe(false);
  });

  it("reports empty input", () => {
    expect(decodeText("  ", "standard")).toEqual({
      ok: false,
      error: "Input is empty.",
    });
  });
});
