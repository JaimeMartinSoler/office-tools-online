/**
 * Editor heights, in visible lines. Every `CodeEditor` takes one of these as
 * its `lines` prop: the box is that many lines tall and scrolls once the
 * content outgrows it. Long lines scroll sideways unless the editor sets
 * `wrap`. Where scrollbars take up layout space (classic scrollbars on
 * Windows/Linux), a horizontal scrollbar covers part of the last line.
 */
export const SIZE_VERTICAL_XL = 40;
export const SIZE_VERTICAL_L = 30;
export const SIZE_VERTICAL_M = 20;
export const SIZE_VERTICAL_S = 10;
/** A single-line field: no line-number or fold gutter, no scrollbars. */
export const SIZE_VERTICAL_XS = 1;

export type EditorLines =
  | typeof SIZE_VERTICAL_XL
  | typeof SIZE_VERTICAL_L
  | typeof SIZE_VERTICAL_M
  | typeof SIZE_VERTICAL_S
  | typeof SIZE_VERTICAL_XS;

/**
 * Outer height (border included) of a `CodeEditor` showing `lines` lines.
 * CodeMirror renders at 0.875rem with a 1.4 line height (1.225rem per line),
 * plus 4px of content padding top and bottom and the 1px wrapper border
 * (inner.tsx pins these in its theme). Non-editor panes that sit beside an
 * editor (rendered previews, result tables) use this too, so the two halves
 * of a pane row line up.
 */
export function editorBoxHeight(lines: EditorLines): string {
  return `calc(${lines} * 1.225rem + 10px)`;
}
