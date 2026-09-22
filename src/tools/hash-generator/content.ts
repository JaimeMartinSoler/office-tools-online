import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Computes message digests — MD5, SHA-1, SHA-256/384/512, SHA3-256/512, RIPEMD-160, CRC32, BLAKE2b and BLAKE3 — and HMACs over any of the MD5, SHA and RIPEMD digests. It also derives keys with PBKDF2 and scrypt and produces bcrypt and Argon2id password hashes. Every algorithm runs as WebAssembly (the hash-wasm library) inside your browser. Digests update as you type; the slow password algorithms wait for the **Generate** button.",
  steps: [
    "Choose an algorithm. The list is split into **Digest / MAC** (fast) and **Key derivation (slow)**.",
    "Type or paste the text to hash. For password algorithms, this is the password.",
    "Set any options: turn on **HMAC** and enter a key, set an output length for BLAKE2b/BLAKE3, or set the salt and cost parameters for PBKDF2, scrypt, bcrypt and Argon2id.",
    "Choose **hex** or **Base64** output (bcrypt and Argon2id always produce their own encoded string), then press **Generate** if you picked a key-derivation algorithm.",
    "Copy the hash from the output pane.",
  ],
  examples: [
    {
      title: "SHA-256 of a short string, in hex and in Base64",
      note: "SHA-256 · no HMAC. The same 32 bytes, written two ways.",
      input: "hello",
      output:
        "hex:     2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824\nBase64:  LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=",
    },
    {
      title: "HMAC-SHA256 with a secret key",
      note: "SHA-256 · HMAC on · key `secret`. A different key gives a completely different result.",
      input: "hello",
      output: "88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b",
    },
    {
      title: "BLAKE3 with the default 32-byte output",
      note: "BLAKE3 · length 32 bytes · no key.",
      input: "hello",
      output: "ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f",
    },
    {
      title: "bcrypt with a fixed salt, so the result is reproducible",
      note: "bcrypt · cost 10 · salt `abcdefghijklmnop` (exactly 16 bytes). Leave the salt empty and the output changes on every run.",
      input: "hunter2",
      output: "$2a$10$WUHhXETkX0fnYkrqZU3ta.o8HFpxZQfhTjdgaMHiuB1Qj4qkYcXuK",
    },
  ],
  faq: [
    {
      question: "Which hash algorithm should I pick?",
      answer:
        "To fingerprint a file or detect changes, use SHA-256, or BLAKE3 if both sides support it and you want speed. To store passwords, use Argon2id or bcrypt — never a plain digest. To authenticate a message with a shared secret, use HMAC-SHA256. Use MD5, SHA-1 and CRC32 only to interoperate with systems that already require them.",
    },
    {
      question: "Why does bcrypt or Argon2id give a different result every time?",
      answer:
        "When the salt field is empty, the tool generates 16 random salt bytes for each run and embeds them in the output (for example `$2a$10$<salt><hash>`). The randomness is intentional: two users with the same password end up with different hashes. To verify a password, a bcrypt or Argon2 library reads the salt back out of the stored string. Enter a fixed salt here only when you need a reproducible test vector.",
    },
    {
      question: "What is HMAC for?",
      answer:
        "HMAC mixes a secret key into a hash, so only someone holding the key can produce or check the value. APIs use it to sign webhooks and requests, and HS256 JWTs are HMAC-SHA256 signatures. A plain hash only detects accidental changes; an HMAC also detects deliberate tampering by anyone without the key.",
    },
    {
      question: "Is MD5 safe to use?",
      answer:
        "Not for security. Practical collision attacks have existed since 2004, so an attacker can build two different inputs with the same MD5, and GPUs compute billions of MD5 hashes per second, so MD5-hashed passwords fall quickly to brute force. MD5 is still fine as a non-adversarial checksum, such as matching a download against a published MD5 value.",
    },
    {
      question: "What is the difference between PBKDF2, scrypt, bcrypt and Argon2id?",
      answer:
        "All four are deliberately slow, so guessing passwords is expensive. PBKDF2 only costs CPU time (iterations). scrypt and Argon2id also require memory, which makes GPU and ASIC attacks much more expensive. Argon2id is the current OWASP first choice, and bcrypt is still widely deployed. PBKDF2 and scrypt here need an explicit salt and output a raw key; bcrypt and Argon2id output a self-describing string.",
    },
    {
      question: "Why does BLAKE3 reject my key?",
      answer:
        "In keyed mode, BLAKE3 needs a key of exactly 32 bytes. The tool measures the key after UTF-8 encoding, so 32 ASCII characters work but 32 accented characters do not. BLAKE2b accepts any key up to 64 bytes. For other algorithms, use the **HMAC** toggle instead.",
    },
  ],
  related:
    "For a random password to feed into bcrypt or Argon2id, use the [Password Generator](/tools/password-generator/). For random identifiers rather than digests, the [UUID & ULID Generator](/tools/uuid-ulid-generator/) draws from the same Web Crypto randomness. To check an HS256 token's signature with its secret, use the [JWT Inspector](/tools/jwt-inspector/).",
};
