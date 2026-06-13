import { describe, expect, it } from "vitest";
import {
  convertToMarkdown,
  csvToMarkdown,
  htmlToMarkdown,
  looksLikeCsv,
  looksLikeHtml,
  markdownToHtml,
} from "./logic";

describe("csvToMarkdown", () => {
  it("builds a GFM table from a simple CSV", () => {
    const result = csvToMarkdown("name,age\nAda,36\nBob,28");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(
      ["| name | age |", "| --- | --- |", "| Ada | 36 |", "| Bob | 28 |"].join(
        "\n",
      ),
    );
  });

  it("keeps commas inside quoted fields", () => {
    const result = csvToMarkdown('a,b\n"x, y",z');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| x, y | z |");
  });

  it("unescapes doubled quotes", () => {
    const result = csvToMarkdown('a\n"say ""hi"""');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('| say "hi" |');
  });

  it("collapses an embedded newline to <br>", () => {
    const result = csvToMarkdown('a,b\n"line1\nline2",z');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| line1<br>line2 | z |");
  });

  it("escapes pipe characters in cells", () => {
    const result = csvToMarkdown("a\nx|y");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| x\\|y |");
  });

  it("pads ragged rows to the header width", () => {
    const result = csvToMarkdown("a,b,c\n1,2");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| 1 | 2 |  |");
  });

  it("auto-detects a tab delimiter", () => {
    const result = csvToMarkdown("a\tb\n1\t2");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| a | b |");
    expect(result.value).toContain("| 1 | 2 |");
  });

  it("auto-detects a semicolon delimiter", () => {
    const result = csvToMarkdown("a;b\n1;2");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| a | b |");
    expect(result.value).toContain("| 1 | 2 |");
  });

  it("errors on empty input", () => {
    const result = csvToMarkdown("   ");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("empty");
  });

  it("ignores trailing blank lines", () => {
    const result = csvToMarkdown("a,b\n1,2\n\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.split("\n")).toHaveLength(3);
  });
});

describe("htmlToMarkdown", () => {
  it("converts a heading", () => {
    const result = htmlToMarkdown("<h1>Title</h1>");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("# Title");
  });

  it("converts an unordered list", () => {
    const result = htmlToMarkdown("<ul><li>one</li><li>two</li></ul>");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("-   one\n-   two");
  });

  it("converts a link", () => {
    const result = htmlToMarkdown('<a href="https://x.com">x</a>');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("[x](https://x.com)");
  });

  it("converts bold and italic", () => {
    const result = htmlToMarkdown("<p><strong>b</strong> <em>i</em></p>");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("**b** _i_");
  });

  it("converts inline and fenced code", () => {
    const inline = htmlToMarkdown("<p><code>x</code></p>");
    expect(inline.ok && inline.value).toBe("`x`");
    const block = htmlToMarkdown("<pre><code>line1\nline2</code></pre>");
    expect(block.ok).toBe(true);
    if (!block.ok) return;
    expect(block.value).toContain("```");
    expect(block.value).toContain("line1\nline2");
  });

  it("converts a table to a GFM table (gfm plugin)", () => {
    const html =
      "<table><thead><tr><th>a</th><th>b</th></tr></thead>" +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const result = htmlToMarkdown(html);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| a | b |");
    expect(result.value).toContain("| 1 | 2 |");
    expect(result.value).toContain("---");
  });
});

describe("convertToMarkdown", () => {
  it("routes html", () => {
    const result = convertToMarkdown("<h2>Hi</h2>", "html");
    expect(result.ok && result.value).toBe("## Hi");
  });

  it("routes csv", () => {
    const result = convertToMarkdown("a,b\n1,2", "csv");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("| a | b |");
  });

  it("passes Markdown input through unchanged (trimmed)", () => {
    const result = convertToMarkdown("\n# Title\n\nbody\n", "markdown");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("# Title\n\nbody");
  });
});

describe("markdownToHtml", () => {
  it("renders a heading", () => {
    expect(markdownToHtml("# Title")).toContain("<h1>Title</h1>");
  });

  it("renders a list", () => {
    const html = markdownToHtml("- one\n- two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
  });

  it("renders a GFM table", () => {
    const html = markdownToHtml("| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>a</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("renders an empty string for empty input", () => {
    expect(markdownToHtml("")).toBe("");
  });
});

describe("looksLikeHtml / looksLikeCsv", () => {
  it("detects HTML tags", () => {
    expect(looksLikeHtml("<p>hi</p>")).toBe(true);
    expect(looksLikeHtml("<br/>")).toBe(true);
    expect(looksLikeHtml("a,b\n1,2")).toBe(false);
    expect(looksLikeHtml("2 < 3 and 4 > 1")).toBe(false);
  });

  it("detects consistent delimited rows as CSV", () => {
    expect(looksLikeCsv("a,b\n1,2\n3,4")).toBe(true);
    expect(looksLikeCsv("a;b\n1;2")).toBe(true);
    expect(looksLikeCsv("just one line")).toBe(false);
    expect(looksLikeCsv("<table><tr><td>a,b</td></tr></table>")).toBe(false);
  });
});
