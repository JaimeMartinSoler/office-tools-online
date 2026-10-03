import type { ToolContent } from "@/lib/tool-content";

/** Built with secret `correct-horse`; checked in content-examples.test.ts. */
export const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQyIiwicm9sZSI6ImVkaXRvciIsImlhdCI6MTcxODMyMzIwMCwiZXhwIjoxNzE4MzI2ODAwfQ.Wfz11OKBCFh9-CLw9XbRBsWoYcv7h-bpPoAFTJXt2uY";

export const content: ToolContent = {
  intro:
    "Splits a JSON Web Token into its three dot-separated parts, decodes the Base64URL header and payload, and pretty-prints both as JSON. Registered claims are labelled (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`), the three date claims are shown as UTC timestamps, and `exp`/`nbf` are checked against your clock. If the token is signed with HS256, HS384 or HS512, you can enter the shared secret to check the signature.",
  steps: [
    "Paste the token (the part after `Bearer `) into **Encoded token**.",
    "Read the decoded **Header** and **Payload** panes, and the **Claims** table with the dates converted.",
    "Check the status line to see whether the token has expired or isn't valid yet.",
    "For an HS256/384/512 token, enter the secret under **Verify signature** to see whether it matches.",
  ],
  examples: [
    {
      title: "Decode a token's header and payload",
      input: SAMPLE_TOKEN,
      inputLabel: "Encoded token",
      output:
        'Header:\n{\n  "alg": "HS256",\n  "typ": "JWT"\n}\n\nPayload:\n{\n  "sub": "user-42",\n  "role": "editor",\n  "iat": 1718323200,\n  "exp": 1718326800\n}',
      outputLabel: "Decoded",
    },
    {
      title: "Read the claims, with dates converted",
      note: "Same token. `role` is a custom claim, so it keeps its own name. The expiry check compares `exp` with the current time.",
      input: SAMPLE_TOKEN,
      inputLabel: "Encoded token",
      output:
        "sub  (Subject)    user-42\nrole              editor\niat  (Issued at)  1718323200  → 2024-06-14T00:00:00Z\nexp  (Expires)    1718326800  → 2024-06-14T01:00:00Z\n\nExpired on 2024-06-14T01:00:00Z.",
      outputLabel: "Claims",
    },
    {
      title: "Verify the HS256 signature",
      note: "The secret is case-sensitive: `Correct-horse` does not match.",
      input: "Secret: correct-horse\nSecret: Correct-horse",
      output: "Signature verified\nSignature mismatch",
      outputLabel: "Verify signature",
    },
  ],
  faq: [
    {
      question: "Is it safe to paste a production JWT here?",
      answer:
        "The token is decoded and verified in your browser and is never sent anywhere; the page's Content-Security-Policy blocks outgoing requests to any other site. Still, a JWT is a live credential until it expires. Prefer expired or test tokens, and treat any secret you type here as you would in any other local tool.",
    },
    {
      question: "Is the payload of a JWT encrypted?",
      answer:
        "No. A standard signed JWT (JWS) is only Base64URL-encoded, so anyone holding the token can read every claim, as this tool shows. The signature protects the payload from being changed, not from being read. Don't put secrets in claims; if the claims themselves must be confidential, you need an encrypted JWE.",
    },
    {
      question: "Why can't it verify my RS256 or ES256 token?",
      answer:
        "Verification here supports the HMAC algorithms HS256, HS384 and HS512, which use one shared secret. RS256, ES256 and EdDSA tokens are signed with a private key and checked with a public key or JWKS, which this tool doesn't load. It still decodes the header and payload of any algorithm.",
    },
    {
      question: "How are exp, nbf and iat interpreted?",
      answer:
        "They are NumericDate values: seconds since 1970-01-01 UTC, not milliseconds. The tool reports \"not yet valid\" when `nbf` is in the future and \"expired\" when the current time is at or after `exp`. It uses your device's clock and does not allow for clock skew, so a token right at the boundary may still be accepted by a server that does.",
    },
    {
      question: "What does \"A JWT has three dot-separated parts\" mean?",
      answer:
        "A signed JWT is `header.payload.signature`. If you pasted only part of it, cut it off, or included a line break, the count is wrong. Unsigned tokens with `alg: none` still end with a trailing dot, so they also have three parts; their signature part is simply empty.",
    },
  ],
  related:
    "Each JWT segment is Base64URL. To decode one piece by hand, use the [Base64 tool](/tools/base64/) in URL-safe mode. An HS256 signature is an HMAC-SHA256, which the [Hash Generator](/tools/hash-generator/) can compute on its own. The iat/exp values are Unix timestamps, which the [Unix Timestamp Converter](/tools/unix-timestamp/) converts in both directions.",
};
