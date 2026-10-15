/**
 * Flattens text for a single-line (`SIZE_VERTICAL_XS`) field: each line break,
 * with the whitespace around it, becomes one space. Without this, a pasted
 * multi-line value would put content on lines the 1-line box can't show.
 */
export function toSingleLine(text: string): string {
  return text.replace(/[^\S\r\n]*(?:\r\n|\r|\n)\s*/g, " ");
}
