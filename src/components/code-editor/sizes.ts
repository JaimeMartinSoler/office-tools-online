/**
 * Editor heights, in visible lines. Every `CodeEditor` takes one of these as
 * its `lines` prop: the box holds exactly that many lines and scrolls (both
 * axes; long lines never wrap) once the content outgrows it.
 */
export const SIZE_VERTICAL_XL = 40;
export const SIZE_VERTICAL_L = 30;
export const SIZE_VERTICAL_M = 20;
export const SIZE_VERTICAL_S = 10;
/** A single-line field: no line-number or fold gutter, no scrollbars. */
export const SIZE_VERTICAL_XS = 1;

/**
 * Outer height (border included) of a `CodeEditor` showing `lines` lines.
 * CodeMirror renders at 0.875rem with a 1.4 line height (1.225rem per line),
 * plus 4px of content padding top and bottom and the 1px wrapper border.
 * Non-editor panes that sit beside an editor (rendered previews, result
 * tables) use this too, so the two halves of a pane row line up.
 */
export function editorBoxHeight(lines: number): string {
  return `calc(${lines} * 1.225rem + 10px)`;
}
