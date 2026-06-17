/**
 * App-wide feature flags.
 *
 * When `LOAD_SAMPLE_BY_DEFAULT` is true, every tool pre-fills its input with a
 * sample on first render so visitors immediately see what the tool does instead
 * of staring at empty boxes. Flip it to false to start every tool blank.
 */
export const LOAD_SAMPLE_BY_DEFAULT = true;

/** The initial input for a tool: its sample when the flag is on, else blank. */
export function initialSample(sample: string): string {
  return LOAD_SAMPLE_BY_DEFAULT ? sample : "";
}
