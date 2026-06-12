export type CaseId =
  | "lower"
  | "upper"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "title"
  | "sentence";

export interface CaseDef {
  id: CaseId;
  label: string;
}

export const CASES: CaseDef[] = [
  { id: "lower", label: "lower case" },
  { id: "upper", label: "UPPER CASE" },
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
  { id: "constant", label: "CONSTANT_CASE" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
];

/** Split arbitrary text into words, handling camelCase and acronym boundaries. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Convert a single string to the requested case. */
export function convertCase(input: string, id: CaseId): string {
  if (id === "lower") return input.toLowerCase();
  if (id === "upper") return input.toUpperCase();

  const words = splitWords(input);
  if (words.length === 0) return "";

  switch (id) {
    case "camel":
      return words
        .map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w)))
        .join("");
    case "pascal":
      return words.map(capitalize).join("");
    case "snake":
      return words.map((w) => w.toLowerCase()).join("_");
    case "kebab":
      return words.map((w) => w.toLowerCase()).join("-");
    case "constant":
      return words.map((w) => w.toUpperCase()).join("_");
    case "title":
      return words.map(capitalize).join(" ");
    case "sentence":
      return words
        .map((w, i) => (i === 0 ? capitalize(w) : w.toLowerCase()))
        .join(" ");
  }
}

/**
 * Convert, optionally line-by-line. In per-line mode each line is converted
 * independently and the line structure is preserved.
 */
export function convert(input: string, id: CaseId, perLine: boolean): string {
  if (!perLine) return convertCase(input, id);
  return input
    .split("\n")
    .map((line) => convertCase(line, id))
    .join("\n");
}

export interface CaseOutput extends CaseDef {
  value: string;
}

/** Produce every case variant at once (for the side-by-side display). */
export function allCases(input: string, perLine: boolean): CaseOutput[] {
  return CASES.map((c) => ({ ...c, value: convert(input, c.id, perLine) }));
}
