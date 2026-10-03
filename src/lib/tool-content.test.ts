import { describe, expect, it } from "vitest";
import { contentLinks, inlineToPlainText, parseInline } from "./tool-content";

describe("parseInline", () => {
  it("splits text, code, strong, and links in order", () => {
    expect(parseInline("Use `a+b` with **Encode**, see [Base64](/tools/base64/).")).toEqual([
      { kind: "text", text: "Use " },
      { kind: "code", text: "a+b" },
      { kind: "text", text: " with " },
      { kind: "strong", text: "Encode" },
      { kind: "text", text: ", see " },
      { kind: "link", text: "Base64", href: "/tools/base64/" },
      { kind: "text", text: "." },
    ]);
  });

  it("leaves plain text alone", () => {
    expect(parseInline("no markup")).toEqual([{ kind: "text", text: "no markup" }]);
    expect(parseInline("")).toEqual([]);
  });

  it("keeps markup-like characters inside code spans literal", () => {
    expect(parseInline("`[x](y)` and `**z**`").filter((n) => n.kind === "code")).toEqual([
      { kind: "code", text: "[x](y)" },
      { kind: "code", text: "**z**" },
    ]);
  });
});

describe("inlineToPlainText", () => {
  it("drops the markup and keeps what a reader sees", () => {
    expect(inlineToPlainText("Press **Generate**, or read [the FAQ](/privacy/) on `bcrypt`.")).toBe(
      "Press Generate, or read the FAQ on bcrypt.",
    );
  });
});

describe("contentLinks", () => {
  it("collects links from every prose field", () => {
    expect(
      contentLinks({
        intro: "[a](/a/)",
        steps: ["[b](/b/)"],
        examples: [{ title: "[c](/c/)", note: "[d](/d/)", input: "[x](/x/)", output: "" }],
        faq: [{ question: "q", answer: "[e](/e/)" }],
        related: "[f](/f/)",
      }).sort(),
    ).toEqual(["/a/", "/b/", "/c/", "/d/", "/e/", "/f/"]);
  });
});
