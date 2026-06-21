import { describe, expect, it } from "vitest";
import {
  base64UrlToBytes,
  bytesToBase64Url,
  decodeJwt,
  describeClaims,
  evaluateValidity,
  verifyHmac,
} from "./logic";

// The canonical jwt.io example token, signed HS256 with "your-256-bit-secret".
const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ" +
  ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const SECRET = "your-256-bit-secret";

describe("base64url round-trip", () => {
  it("encodes and decodes bytes losslessly", () => {
    const bytes = new Uint8Array([0, 1, 250, 255, 128]);
    expect(base64UrlToBytes(bytesToBase64Url(bytes))).toEqual(bytes);
  });

  it("produces url-safe, unpadded output", () => {
    const encoded = bytesToBase64Url(new Uint8Array([255, 255, 255]));
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe("decodeJwt", () => {
  it("decodes header and payload", () => {
    const result = decodeJwt(SAMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.headerObject).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.payloadObject).toMatchObject({
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    });
    expect(result.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
  });

  it("rejects tokens without three parts", () => {
    expect(decodeJwt("a.b").ok).toBe(false);
    expect(decodeJwt("").ok).toBe(false);
  });

  it("rejects a non-JSON payload", () => {
    const bad = "eyJhbGciOiJIUzI1NiJ9.not-base64-json.sig";
    expect(decodeJwt(bad).ok).toBe(false);
  });
});

describe("describeClaims", () => {
  it("labels registered claims and formats dates", () => {
    const claims = describeClaims({ iss: "me", iat: 1516239022, custom: 1 });
    expect(claims.find((c) => c.key === "iss")?.label).toBe("Issuer");
    expect(claims.find((c) => c.key === "iat")?.detail).toBe(
      "2018-01-18T01:30:22Z",
    );
    expect(claims.find((c) => c.key === "custom")?.label).toBe("custom");
  });
});

describe("evaluateValidity", () => {
  const now = 1_600_000_000_000; // 2020-09-13T12:26:40Z

  it("flags expired tokens", () => {
    expect(evaluateValidity({ exp: 1_500_000_000 }, now).state).toBe("expired");
  });

  it("accepts a future expiry", () => {
    expect(evaluateValidity({ exp: 1_700_000_000 }, now).state).toBe("valid");
  });

  it("flags not-yet-valid tokens", () => {
    expect(evaluateValidity({ nbf: 1_700_000_000 }, now).state).toBe(
      "not-yet-valid",
    );
  });

  it("reports a missing expiry", () => {
    expect(evaluateValidity({ sub: "x" }, now).state).toBe("no-expiry");
  });
});

describe("verifyHmac", () => {
  it("accepts the correct secret", async () => {
    const decoded = decodeJwt(SAMPLE);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    const result = await verifyHmac(decoded.value, SECRET);
    expect(result).toEqual({ ok: true, value: true });
  });

  it("rejects a wrong secret", async () => {
    const decoded = decodeJwt(SAMPLE);
    if (!decoded.ok) return;
    const result = await verifyHmac(decoded.value, "wrong");
    expect(result).toEqual({ ok: true, value: false });
  });

  it("errors when no secret is given", async () => {
    const decoded = decodeJwt(SAMPLE);
    if (!decoded.ok) return;
    expect((await verifyHmac(decoded.value, "")).ok).toBe(false);
  });
});
