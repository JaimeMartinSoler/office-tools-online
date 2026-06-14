import { describe, expect, it } from "vitest";
import { decodeUrl, encodeUrl, parseQuery } from "./logic";

describe("encodeUrl", () => {
  it("encodes a component, escaping reserved characters", () => {
    expect(encodeUrl("a b&c=d?e", "component")).toEqual({
      ok: true,
      value: "a%20b%26c%3Dd%3Fe",
    });
  });

  it("preserves URL structure in full mode", () => {
    expect(encodeUrl("https://x.com/a b?q=1&r=2", "full")).toEqual({
      ok: true,
      value: "https://x.com/a%20b?q=1&r=2",
    });
  });

  it("round-trips unicode", () => {
    const input = "café ünïçødé 😀";
    const encoded = encodeUrl(input, "component");
    expect(encoded.ok).toBe(true);
    if (encoded.ok) {
      expect(decodeUrl(encoded.value, "component")).toEqual({
        ok: true,
        value: input,
      });
    }
  });

  it("reports lone surrogates instead of throwing", () => {
    expect(encodeUrl("\uD800", "component").ok).toBe(false);
  });
});

describe("decodeUrl", () => {
  it("decodes a percent-encoded component", () => {
    expect(decodeUrl("a%20b%26c", "component")).toEqual({
      ok: true,
      value: "a b&c",
    });
  });

  it("rejects truncated percent sequences", () => {
    expect(decodeUrl("100%", "component").ok).toBe(false);
    expect(decodeUrl("%zz", "component").ok).toBe(false);
  });
});

describe("parseQuery", () => {
  it("parses a full URL into parts and decoded params", () => {
    const result = parseQuery("https://example.com/search?q=hello%20world&page=2#top");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url).toEqual({
        protocol: "https:",
        host: "example.com",
        path: "/search",
        hash: "#top",
      });
      expect(result.value.params).toEqual([
        { key: "q", value: "hello world" },
        { key: "page", value: "2" },
      ]);
    }
  });

  it("parses a bare query string with a leading '?'", () => {
    const result = parseQuery("?name=Ada+Lovelace&role=Engineer");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url).toBeNull();
      expect(result.value.params).toEqual([
        { key: "name", value: "Ada Lovelace" },
        { key: "role", value: "Engineer" },
      ]);
    }
  });

  it("parses a query string without a leading '?'", () => {
    const result = parseQuery("a=1&b=2&a=3");
    expect(result.ok && result.value.params).toEqual([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
      { key: "a", value: "3" },
    ]);
  });

  it("strips a path prefix and trailing fragment from a relative query", () => {
    const result = parseQuery("/page?x=1#section");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url).toBeNull();
      expect(result.value.params).toEqual([{ key: "x", value: "1" }]);
    }
  });

  it("returns an empty param list for a URL with no query", () => {
    const result = parseQuery("https://example.com/about");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url?.host).toBe("example.com");
      expect(result.value.params).toEqual([]);
    }
  });

  it("reports empty input", () => {
    expect(parseQuery("   ")).toEqual({ ok: false, error: "Input is empty." });
  });
});
