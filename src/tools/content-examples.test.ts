import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ToolExample } from "@/lib/tool-content";
import { decodeText, encodeText } from "./base64/logic";
import { content as base64 } from "./base64/content";
import { gradeContrast, formatColor, parseColor } from "./color-converter/logic";
import { content as color } from "./color-converter/content";
import { explainCron, type CronMode } from "./cron-expression/logic";
import { content as cron } from "./cron-expression/content";
import { DEFAULT_OPTIONS as HASH_DEFAULTS, hash, type HashOptions } from "./hash-generator/logic";
import { content as hashContent } from "./hash-generator/content";
import { inferSchema, schemaToSample } from "./json-json-schema/logic";
import { content as jsonSchema, SAMPLE_SCHEMA } from "./json-json-schema/content";
import { convertData } from "./json-yaml-xml/logic";
import { content as jsonYaml } from "./json-yaml-xml/content";
import { decodeJwt, describeClaims, evaluateValidity, verifyHmac } from "./jwt-inspector/logic";
import { content as jwt, SAMPLE_TOKEN } from "./jwt-inspector/content";
import { convertToMarkdown } from "./markdown/logic";
import { content as markdown } from "./markdown/content";
import { BASE_LABELS, BASE_PREFIX, BASES, parseValue, toAllBases, toBitGroups, type Base } from "./number-base-converter/logic";
import { content as numberBase } from "./number-base-converter/content";
import { DEFAULT_OPTIONS as PW_DEFAULTS, estimateStrength, poolFor, type PasswordOptions } from "./password-generator/logic";
import { content as password } from "./password-generator/content";
import { allCases, convert as convertCase } from "./string-case-converter/logic";
import { content as stringCase } from "./string-case-converter/content";
import { computeDiff, type DiffMode } from "./text-diff/logic";
import { content as textDiff } from "./text-diff/content";
import { describe as describeInstant, parseDate, parseTimestamp } from "./unix-timestamp/logic";
import { content as unixTimestamp } from "./unix-timestamp/content";
import { decodeUrl, encodeUrl, parseQuery } from "./url/logic";
import { content as url } from "./url/content";
import { generate } from "./uuid-ulid-generator/logic";
import { content as uuid } from "./uuid-ulid-generator/content";

/**
 * Every worked example on a tool page must be what the tool actually produces.
 * Each block below re-runs its example's input through the tool's own logic
 * and compares the result with the published output, so a behaviour change
 * that makes the copy wrong fails here instead of shipping.
 */

/** Look up an example by its title so reordering the copy can't mis-pair them. */
function example(examples: ToolExample[], title: string): ToolExample {
  const found = examples.find((e) => e.title === title);
  if (!found) throw new Error(`No example titled "${title}"`);
  return found;
}

function value<T>(result: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

/** Split "Label   value" lines (aligned with spaces) into a map. */
function rows(text: string): Map<string, string> {
  return new Map(
    text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const match = line.match(/^(.+?)\s{2,}(.*)$/);
        if (!match) throw new Error(`Not a "label  value" row: ${line}`);
        return [match[1]!.trim(), match[2]!] as const;
      }),
  );
}

describe("json-yaml-xml examples", () => {
  const ex = (title: string) => example(jsonYaml.examples, title);

  it("beautifies minified JSON", () => {
    const e = ex("Beautify minified JSON");
    expect(value(convertData(e.input, "json", "json", 2, true))).toBe(e.output);
  });

  it("converts JSON to YAML", () => {
    const e = ex("JSON to YAML for a config file");
    expect(value(convertData(e.input, "json", "yaml")).trimEnd()).toBe(e.output);
  });

  it("converts XML with an attribute to JSON", () => {
    const e = ex("XML with an attribute to JSON");
    expect(value(convertData(e.input, "xml", "json"))).toBe(e.output);
  });

  it("flattens nested JSON into CSV", () => {
    const e = ex("Nested JSON to a spreadsheet-ready CSV");
    const csv = { nested: true, inferTypes: false };
    expect(value(convertData(e.input, "json", "csv", 2, true, csv))).toBe(e.output);
  });
});

describe("json-json-schema examples", () => {
  const ex = (title: string) => example(jsonSchema.examples, title);
  const opts = { requiredByDefault: true, inferEnums: false };

  it("infers a schema from one object", () => {
    const e = ex("Infer a schema from one object");
    expect(value(inferSchema(e.input, opts))).toBe(e.output);
  });

  it("detects optional fields across array items", () => {
    const e = ex("Optional fields are detected across array items");
    expect(value(inferSchema(e.input, opts))).toBe(e.output);
  });

  it("generates a sample document (seed 1, and the seed-2 id in the note)", () => {
    const e = ex("Generate a sample document from a schema");
    expect(e.input).toBe(SAMPLE_SCHEMA);
    expect(value(schemaToSample(e.input, 1))).toBe(e.output);
    expect(value(schemaToSample(e.input, 2))).toContain('"id": 734');
    expect(e.note).toContain('"id": 734');
  });

  it("the Infer enums FAQ quotes the real output", () => {
    const schema = value(
      inferSchema('["draft","live","draft"]', { requiredByDefault: false, inferEnums: true }),
    );
    expect(JSON.parse(schema).items.enum).toEqual(["draft", "live"]);
  });
});

describe("base64 examples", () => {
  const ex = (title: string) => example(base64.examples, title);

  it("encodes a sentence", () => {
    const e = ex("Encode a sentence");
    expect(value(encodeText(e.input, "standard"))).toBe(e.output);
  });

  it("shows standard vs URL-safe for the same bytes", () => {
    const e = ex("Standard vs URL-safe for the same bytes");
    const out = rows(e.output.replace(/:/g, " "));
    expect(value(encodeText(e.input, "standard"))).toBe(out.get("Standard"));
    expect(value(encodeText(e.input, "url"))).toBe(out.get("URL-safe"));
  });

  it("encodes non-ASCII text as UTF-8", () => {
    const e = ex("Non-ASCII text is encoded as UTF-8");
    expect(value(encodeText(e.input, "standard"))).toBe(e.output);
    expect(new TextEncoder().encode(e.input)).toHaveLength(9);
  });

  it("decodes unpadded input", () => {
    const e = ex("Decode input that has lost its padding");
    expect(value(decodeText(e.input, "standard"))).toBe(e.output);
    expect(value(decodeText(`${e.input}=`, "standard"))).toBe(e.output);
  });
});

describe("hash-generator examples", () => {
  const ex = (title: string) => example(hashContent.examples, title);
  const run = async (overrides: Partial<HashOptions>) =>
    value(await hash({ ...HASH_DEFAULTS, ...overrides }));

  it("SHA-256 in hex and Base64", async () => {
    const e = ex("SHA-256 of a short string, in hex and in Base64");
    const out = rows(e.output.replace(/^(hex|Base64):/gm, "$1 "));
    expect(await run({ input: e.input })).toBe(out.get("hex"));
    expect(await run({ input: e.input, encoding: "base64" })).toBe(out.get("Base64"));
  });

  it("HMAC-SHA256", async () => {
    const e = ex("HMAC-SHA256 with a secret key");
    expect(await run({ input: e.input, hmac: true, key: "secret" })).toBe(e.output);
  });

  it("BLAKE3", async () => {
    const e = ex("BLAKE3 with the default 32-byte output");
    expect(await run({ input: e.input, algorithm: "blake3" })).toBe(e.output);
  });

  it("bcrypt with a fixed salt", async () => {
    const e = ex("bcrypt with a fixed salt, so the result is reproducible");
    const out = await run({
      input: e.input,
      algorithm: "bcrypt",
      salt: "abcdefghijklmnop",
      bcryptCost: 10,
    });
    expect(out).toBe(e.output);
  });
});

describe("url examples", () => {
  const ex = (title: string) => example(url.examples, title);

  it("component-encodes a query value", () => {
    const e = ex("Encode a value for a query string");
    expect(value(encodeUrl(e.input, "component"))).toBe(e.output);
  });

  it("encodes a whole URL", () => {
    const e = ex("Encode a whole URL without breaking it");
    expect(value(encodeUrl(e.input, "full"))).toBe(e.output);
  });

  it("decodes UTF-8 escapes", () => {
    const e = ex("Decode UTF-8 percent-escapes");
    expect(value(decodeUrl(e.input, "component"))).toBe(e.output);
  });

  it("parses repeated query keys", () => {
    const e = ex("Parse a query string with repeated keys");
    const expected = e.output.split("\n").map((line) => {
      const [key, ...rest] = line.split(/\s{2,}/);
      return { key, value: rest.join("") };
    });
    expect(value(parseQuery(e.input)).params).toEqual(expected);
  });
});

describe("jwt-inspector examples", () => {
  const ex = (title: string) => example(jwt.examples, title);
  const decoded = value(decodeJwt(SAMPLE_TOKEN));

  it("decodes the header and payload", () => {
    const e = ex("Decode a token's header and payload");
    expect(e.output).toBe(`Header:\n${decoded.header}\n\nPayload:\n${decoded.payload}`);
  });

  it("annotates the claims and reports expiry", () => {
    const e = ex("Read the claims, with dates converted");
    const claims = describeClaims(decoded.payloadObject);
    for (const claim of claims) {
      expect(e.output).toContain(claim.key);
      expect(e.output).toContain(String(claim.raw));
      if (claim.label !== claim.key) expect(e.output).toContain(`(${claim.label})`);
      if (claim.detail) expect(e.output).toContain(claim.detail);
    }
    const validity = evaluateValidity(decoded.payloadObject, Date.now());
    expect(e.output.endsWith(validity.message)).toBe(true);
  });

  it("verifies the signature only with the exact secret", async () => {
    expect(value(await verifyHmac(decoded, "correct-horse"))).toBe(true);
    expect(value(await verifyHmac(decoded, "Correct-horse"))).toBe(false);
    const e = ex("Verify the HS256 signature");
    expect(e.input).toBe("Secret: correct-horse\nSecret: Correct-horse");
    expect(e.output).toBe("Signature verified\nSignature mismatch");
  });
});

describe("password-generator examples", () => {
  const ex = (title: string) => example(password.examples, title);
  const all = { lower: true, upper: true, digit: true, special: true };
  const banner = (options: PasswordOptions) => {
    const s = estimateStrength(options);
    return `${s.label} — about ${s.bits} bits of entropy, roughly ${s.combinations} possible character combinations.`;
  };
  /** The sample password must be one the settings could have produced. */
  const fits = (pw: string, options: PasswordOptions) => {
    expect(pw).toHaveLength(options.length);
    const pool = (["lower", "upper", "digit", "special"] as const)
      .filter((set) => options.sets[set])
      .map((set) => poolFor(set, options.excludeAmbiguous))
      .join("");
    for (const ch of pw) expect(pool).toContain(ch);
  };

  it("default settings", () => {
    const e = ex("The default settings");
    const options = { ...PW_DEFAULTS, sets: all };
    const [pw, , line] = e.output.split("\n");
    fits(pw!, options);
    expect(line).toBe(banner(options));
  });

  it("lowercase and digits without look-alikes", () => {
    const e = ex("Easy to type: lowercase and digits, no look-alikes");
    const options: PasswordOptions = {
      length: 12,
      sets: { lower: true, upper: false, digit: true, special: false },
      min: { lower: 1, upper: 0, digit: 2, special: 0 },
      excludeAmbiguous: true,
    };
    const [pw, , line] = e.output.split("\n");
    fits(pw!, options);
    expect(line).toBe(banner(options));
  });

  it("a 6-digit PIN", () => {
    const e = ex("Why a 6-digit PIN is weak");
    const options: PasswordOptions = {
      ...PW_DEFAULTS,
      length: 6,
      sets: { lower: false, upper: false, digit: true, special: false },
    };
    expect(e.output).toBe(banner(options));
  });
});

describe("uuid-ulid-generator examples", () => {
  const ex = (title: string) => example(uuid.examples, title);
  const at = Date.parse("2024-06-14T00:00:00Z");
  const ids = (e: ToolExample) => e.output.split("\n");

  it("UUID v4s have the version and variant bits", () => {
    for (const id of ids(ex("Three random UUID v4s"))) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });

  it("UUID v7s carry the stated timestamp", () => {
    const [sample] = value(generate({ kind: "uuidv7", count: 1, uppercase: false, braces: false }, at));
    for (const id of ids(ex("UUID v7s generated at 2024-06-14 00:00:00 UTC"))) {
      expect(id.slice(0, 13)).toBe(sample!.slice(0, 13));
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    expect(parseInt(sample!.slice(0, 13).replace("-", ""), 16)).toBe(at);
  });

  it("uppercase braced GUIDs", () => {
    const [sample] = value(generate({ kind: "uuidv7", count: 1, uppercase: true, braces: true }, at));
    for (const id of ids(ex("GUID literals for C#"))) {
      expect(id.slice(0, 14)).toBe(sample!.slice(0, 14));
      expect(id).toMatch(/^\{[0-9A-F]{8}-[0-9A-F]{4}-7[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}\}$/);
    }
  });

  it("ULIDs share the timestamp prefix", () => {
    const [sample] = value(generate({ kind: "ulid", count: 1, uppercase: true, braces: false }, at));
    for (const id of ids(ex("ULIDs from the same millisecond"))) {
      expect(id.slice(0, 10)).toBe(sample!.slice(0, 10));
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    }
  });
});

describe("number-base-converter examples", () => {
  const ex = (title: string) => example(numberBase.examples, title);
  const table = (input: string, base: Base | "auto") => {
    const all = toAllBases(value(parseValue(input, base)));
    return BASES.map((b) => {
      const text = all[b];
      const display = BASE_PREFIX[b] && text[0] !== "-" ? BASE_PREFIX[b] + text : text;
      return `${BASE_LABELS[b].padEnd(13)}${display}`;
    }).join("\n");
  };

  it("hex value in every base, with its bit grid", () => {
    const e = ex("A hex value in every base");
    const [conversions, bits] = e.output.split("\n\n");
    expect(conversions).toBe(table(e.input, "auto"));
    expect(bits).toBe(`Bits: ${toBitGroups(value(parseValue(e.input, "auto"))).bytes.join(" ")}`);
  });

  it("octal permissions", () => {
    const e = ex("Unix file permissions from octal");
    expect(e.output).toBe(table(e.input, "auto"));
  });

  it("values past 64 bits", () => {
    const e = ex("Larger than a 64-bit integer");
    expect(e.output).toBe(table(e.input, "dec"));
  });

  it("negative numbers", () => {
    const e = ex("A negative number");
    expect(e.output).toBe(table(e.input, "auto"));
  });

  it("the FAQ's claims about FF and two's complement hold", () => {
    expect(parseValue("FF", "auto").ok).toBe(false);
    expect(value(parseValue("0xFF", "hex"))).toBe(255n);
    expect(value(parseValue("0Xff", "auto"))).toBe(255n);
    expect(toAllBases(256n - 42n).hex).toBe("D6");
  });
});

describe("markdown examples", () => {
  const ex = (title: string) => example(markdown.examples, title);

  it("HTML fragment", () => {
    const e = ex("An HTML fragment to Markdown");
    expect(value(convertToMarkdown(e.input, "html"))).toBe(e.output);
  });

  it("HTML table", () => {
    const e = ex("An HTML table to a GitHub-flavored table");
    expect(value(convertToMarkdown(e.input, "html"))).toBe(e.output);
  });

  it("semicolon CSV", () => {
    const e = ex("A semicolon-separated CSV export to a table");
    expect(value(convertToMarkdown(e.input, "csv"))).toBe(e.output);
  });
});

describe("string-case-converter examples", () => {
  const ex = (title: string) => example(stringCase.examples, title);

  it("every case for one phrase", () => {
    const e = ex("One phrase in every case");
    const out = rows(e.output);
    for (const c of allCases(e.input, false)) expect(out.get(c.label), c.label).toBe(c.value);
    expect(out.size).toBe(9);
  });

  it("acronym-heavy identifier", () => {
    const e = ex("Splitting an acronym-heavy identifier");
    const cases = new Map(allCases(e.input, false).map((c) => [c.label, c.value]));
    for (const [label, expected] of rows(e.output)) expect(cases.get(label), label).toBe(expected);
  });

  it("per-line camelCase", () => {
    const e = ex("Renaming a list of column names");
    expect(convertCase(e.input, "camel", true)).toBe(e.output);
  });

  it("the FAQ's accent and digit claims hold", () => {
    expect(convertCase("café au lait", "snake", false)).toBe("caf_au_lait");
    expect(convertCase("version 2 beta", "camel", false)).toBe("version2Beta");
    expect(convertCase("utf8String", "snake", false)).toBe("utf8_string");
  });
});

describe("text-diff examples", () => {
  const ex = (title: string) => example(textDiff.examples, title);

  /** Render the unified view the way the example shows it. */
  function unified(input: string, mode: DiffMode): string {
    const [, original, changed] = input.split(/^(?:Original|Changed):\n/m);
    const diff = value(computeDiff(original!.replace(/\n\n$/, ""), changed!, mode));
    const text = (cell: { segments: { text: string }[] } | null) =>
      cell?.segments.map((s) => s.text).join("") ?? "";
    const lines: string[] = [];
    for (const row of diff.rows) {
      if (row.type === "equal") lines.push(`  ${text(row.left)}`);
      if (row.type === "delete" || row.type === "modify") lines.push(`− ${text(row.left)}`);
      if (row.type === "insert" || row.type === "modify") lines.push(`+ ${text(row.right)}`);
    }
    return `${lines.join("\n")}\n\n+${diff.additions} added, −${diff.deletions} removed`;
  }

  it("text mode", () => {
    const e = ex("A changed config value and an added line");
    expect(unified(e.input, "text")).toBe(e.output);
  });

  it("json mode", () => {
    const e = ex("Two JSON documents that differ only in one value");
    expect(unified(e.input, "json")).toBe(e.output);
  });
});

describe("unix-timestamp examples", () => {
  // The local-time rows depend on the machine's zone; the examples show UTC.
  let tz: string | undefined;
  beforeAll(() => {
    tz = process.env.TZ;
    process.env.TZ = "UTC";
  });
  afterAll(() => {
    process.env.TZ = tz;
  });

  const ex = (title: string) => example(unixTimestamp.examples, title);
  const check = (e: ToolExample, date: Date) => {
    const described = new Map(describeInstant(date).map((r) => [r.label, r.value]));
    for (const [label, expected] of rows(e.output)) {
      expect(described.get(label), label).toBe(expected);
    }
  };

  it("seconds", () => {
    const e = ex("A 10-digit timestamp in seconds");
    check(e, value(parseTimestamp(e.input, "auto")));
  });

  it("milliseconds", () => {
    const e = ex("A 13-digit JavaScript timestamp");
    check(e, value(parseTimestamp(e.input, "auto")));
  });

  it("date with offset", () => {
    const e = ex("A date with a UTC offset to a timestamp");
    check(e, value(parseDate(e.input)));
  });

  it("2038", () => {
    const e = ex("The year-2038 limit");
    check(e, value(parseTimestamp(e.input, "auto")));
  });

  it("the FAQ's negative-timestamp claim holds", () => {
    expect(value(parseTimestamp("-86400", "seconds")).toISOString()).toBe(
      "1969-12-31T00:00:00.000Z",
    );
    expect(parseTimestamp("2024-06-14", "auto").ok).toBe(false);
  });
});

describe("cron-expression examples", () => {
  const ex = (title: string) => example(cron.examples, title);
  const check = (e: ToolExample, mode: CronMode) => {
    const fields = value(explainCron(e.input, mode)).fields;
    for (const line of e.output.split("\n")) {
      const field = fields.find((f) => line.startsWith(f.label));
      expect(field, line).toBeDefined();
      expect(line.split(/\s{2,}/)).toEqual([field!.label, field!.token, field!.periodicity, field!.matches]);
    }
  };

  it("office hours", () => check(ex("Every 15 minutes during office hours on weekdays"), "standard"));
  it("monthly", () => check(ex("Midnight on the first of every month"), "standard"));
  it("names", () => check(ex("Names instead of numbers"), "extended"));
  it("stepped range", () => check(ex("A stepped range"), "standard"));

  it("the FAQ's Quartz claim holds", () => {
    expect(explainCron("0 0 * * * *", "standard").ok).toBe(false);
    expect(explainCron("0 0 ? * MON", "extended").ok).toBe(false);
  });
});

describe("color-converter examples", () => {
  const ex = (title: string) => example(color.examples, title);
  const formats = (input: string) => {
    const f = formatColor(value(parseColor(input)));
    return `Hex    ${f.hex}\nRGB    ${f.rgb}\nHSL    ${f.hsl}\nOKLCH  ${f.oklch}`;
  };

  it("hex", () => {
    const e = ex("A HEX color in every notation");
    expect(formats(e.input)).toBe(e.output);
  });

  it("legacy rgb()", () => {
    const e = ex("Legacy comma syntax in, modern syntax out");
    expect(formats(e.input)).toBe(e.output);
  });

  it("alpha", () => {
    const e = ex("A semi-transparent color");
    expect(formats(e.input)).toBe(e.output);
  });

  it("contrast", () => {
    const e = ex("The lightest gray that passes AA on white");
    const grade = gradeContrast(value(parseColor("#767676")), value(parseColor("#ffffff")));
    const pf = (pass: boolean) => (pass ? "Pass" : "Fail");
    expect(e.output).toBe(
      [
        `${grade.ratio} : 1`,
        `${pf(grade.aaNormal)} · AA (normal)`,
        `${pf(grade.aaaNormal)} · AAA (normal)`,
        `${pf(grade.aaLarge)} · AA (large)`,
        `${pf(grade.aaaLarge)} · AAA (large)`,
      ].join("\n"),
    );
    // The note's "one step lighter fails" and the FAQ's blue-500 figure.
    expect(gradeContrast(value(parseColor("#777777")), value(parseColor("#fff"))).ratio).toBe(4.48);
    expect(gradeContrast(value(parseColor("#3b82f6")), value(parseColor("#fff"))).ratio).toBe(3.68);
  });
});

describe("content.ts files", () => {
  const toolsDir = fileURLToPath(new URL(".", import.meta.url));
  const files = readdirSync(toolsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${toolsDir}${entry.name}/content.ts`);

  it.each(files)("%s is pure data (imports nothing but the content types)", (file) => {
    const imports = [...readFileSync(file, "utf8").matchAll(/^import .*$/gm)].map((m) => m[0]);
    expect(imports).toEqual(['import type { ToolContent } from "@/lib/tool-content";']);
  });
});
