import { err, ok, type Result } from "@/lib/result";

export type CronMode = "standard" | "extended";

export interface CronFieldExplanation {
  /** Stable id for React keys, e.g. "minute". */
  id: string;
  /** Human label, e.g. "Day of month". */
  label: string;
  /** The raw token from the expression, e.g. the minute field's value. */
  token: string;
  /** Plain-English periodicity, e.g. "Every 15 minutes". */
  periodicity: string;
  /** The matched values, e.g. "0, 15, 30, 45" or "0–59 (all)". */
  matches: string;
}

export interface CronExplanation {
  fields: CronFieldExplanation[];
}

type FieldId = "minute" | "hour" | "day-of-month" | "month" | "day-of-week";

interface FieldSpec {
  id: FieldId;
  label: string;
  min: number;
  max: number;
  /** name → number map; present only for fields that accept names. */
  names?: Record<string, number>;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DOW_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const MONTH_DISPLAY = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DOW_DISPLAY = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const FIELD_SPECS: FieldSpec[] = [
  { id: "minute", label: "Minute", min: 0, max: 59 },
  { id: "hour", label: "Hour", min: 0, max: 23 },
  { id: "day-of-month", label: "Day of month", min: 1, max: 31 },
  { id: "month", label: "Month", min: 1, max: 12, names: MONTH_NAMES },
  { id: "day-of-week", label: "Day of week", min: 0, max: 7, names: DOW_NAMES },
];

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const EVERY: Record<FieldId, string> = {
  minute: "every minute",
  hour: "every hour",
  "day-of-month": "every day",
  month: "every month",
  "day-of-week": "every day of the week",
};

const PLURAL: Record<FieldId, string> = {
  minute: "minutes",
  hour: "hours",
  "day-of-month": "days",
  month: "months",
  "day-of-week": "days of the week",
};

/**
 * Explain a cron expression field by field. Pure and deterministic — no date
 * math, no I/O. `standard` accepts the classic 5 numeric fields; `extended`
 * additionally accepts @-macros and JAN–DEC / SUN–SAT names.
 */
export function explainCron(input: string, mode: CronMode): Result<CronExplanation> {
  const trimmed = input.trim();
  if (trimmed === "") return err("Enter a cron expression.");

  let expr = trimmed;
  if (expr.startsWith("@")) {
    if (mode === "standard") {
      return err(`Macros like "${expr}" are only available in Macros + Names mode.`);
    }
    const macro = expr.toLowerCase();
    if (macro === "@reboot") {
      return err(`"@reboot" runs once at startup and has no field schedule to explain.`);
    }
    const expanded = MACROS[macro];
    if (!expanded) {
      return err(`Unknown macro "${expr}". Try @yearly, @monthly, @weekly, @daily, or @hourly.`);
    }
    expr = expanded;
  }

  const parts = expr.split(/\s+/);
  if (parts.length !== 5) {
    return err(
      `Expected 5 fields (minute hour day-of-month month day-of-week); got ${parts.length}.`,
    );
  }

  const fields: CronFieldExplanation[] = [];
  for (const [i, spec] of FIELD_SPECS.entries()) {
    const token = parts[i] ?? "";
    const parsed = parseField(spec, token, mode);
    if (!parsed.ok) return err(parsed.error);
    fields.push({
      id: spec.id,
      label: spec.label,
      token,
      periodicity: parsed.value.periodicity,
      matches: parsed.value.matches,
    });
  }

  return ok({ fields });
}

function parseField(
  spec: FieldSpec,
  field: string,
  mode: CronMode,
): Result<{ periodicity: string; matches: string }> {
  const values = new Set<number>();
  const phrases: string[] = [];

  for (const raw of field.split(",")) {
    const term = raw.trim();
    if (term === "") return err(`${spec.label}: empty term in "${field}".`);
    const parsed = parseTerm(spec, term, mode);
    if (!parsed.ok) return err(parsed.error);
    for (const v of parsed.value.values) values.add(v);
    phrases.push(parsed.value.phrase);
  }

  const sorted = [...values].sort((a, b) => a - b);
  return ok({
    periodicity: capitalize(joinPhrases([...new Set(phrases)])),
    matches: matchesText(spec, sorted),
  });
}

function parseTerm(
  spec: FieldSpec,
  term: string,
  mode: CronMode,
): Result<{ values: number[]; phrase: string }> {
  let rangePart = term;
  let step = 1;
  let hasStep = false;

  const slash = term.indexOf("/");
  if (slash !== -1) {
    rangePart = term.slice(0, slash);
    const stepStr = term.slice(slash + 1);
    if (!/^\d+$/.test(stepStr)) {
      return err(`${spec.label}: step must be a positive integer in "${term}".`);
    }
    step = Number(stepStr);
    if (step < 1) return err(`${spec.label}: step must be at least 1 in "${term}".`);
    hasStep = true;
  }

  let lo: number;
  let hi: number;
  let isAll = false;
  let isSingle = false;

  if (rangePart === "*") {
    lo = spec.min;
    hi = spec.max;
    isAll = true;
  } else if (rangePart.includes("-")) {
    const bits = rangePart.split("-");
    if (bits.length !== 2) {
      return err(`${spec.label}: invalid range "${rangePart}".`);
    }
    const a = parseValue(spec, bits[0] ?? "", mode);
    if (!a.ok) return err(a.error);
    const b = parseValue(spec, bits[1] ?? "", mode);
    if (!b.ok) return err(b.error);
    lo = a.value;
    hi = b.value;
    if (lo > hi) {
      return err(
        `${spec.label}: range start "${valueName(spec, lo)}" is after the end "${valueName(spec, hi)}".`,
      );
    }
  } else {
    const single = parseValue(spec, rangePart, mode);
    if (!single.ok) return err(single.error);
    lo = single.value;
    if (hasStep) {
      hi = spec.max;
    } else {
      hi = single.value;
      isSingle = true;
    }
  }

  const values: number[] = [];
  for (let n = lo; n <= hi; n += step) values.push(normalize(spec, n));

  return ok({ values, phrase: phraseFor(spec, lo, hi, step, isAll, isSingle) });
}

function parseValue(spec: FieldSpec, str: string, mode: CronMode): Result<number> {
  const s = str.trim();
  if (s === "") return err(`${spec.label}: empty value.`);

  if (/^[A-Za-z]+$/.test(s)) {
    if (!spec.names) return err(`${spec.label}: names are not allowed here ("${s}").`);
    if (mode !== "extended") {
      return err(`${spec.label}: names like "${s}" are only available in Macros + Names mode.`);
    }
    const n = spec.names[s.toUpperCase()];
    if (n === undefined) return err(`${spec.label}: unknown name "${s}".`);
    return ok(n);
  }

  if (!/^\d+$/.test(s)) return err(`${spec.label}: invalid value "${s}".`);
  const n = Number(s);
  if (n < spec.min || n > spec.max) {
    return err(`${spec.label}: ${n} is out of range (${spec.min}–${spec.max}).`);
  }
  return ok(n);
}

/** Day-of-week 7 is Sunday, same as 0 — fold it so sets dedupe correctly. */
function normalize(spec: FieldSpec, n: number): number {
  return spec.id === "day-of-week" && n === 7 ? 0 : n;
}

function valueName(spec: FieldSpec, n: number): string {
  if (spec.id === "month") return MONTH_DISPLAY[n] ?? String(n);
  if (spec.id === "day-of-week") return DOW_DISPLAY[n % 7] ?? String(n);
  return String(n);
}

function phraseFor(
  spec: FieldSpec,
  lo: number,
  hi: number,
  step: number,
  isAll: boolean,
  isSingle: boolean,
): string {
  if (isAll) {
    return step === 1 ? EVERY[spec.id] : `every ${step} ${PLURAL[spec.id]}`;
  }
  if (isSingle) return singlePhrase(spec, lo);
  if (step > 1) {
    return `every ${step} ${PLURAL[spec.id]} from ${valueName(spec, lo)} through ${valueName(spec, hi)}`;
  }
  return rangePhrase(spec, lo, hi);
}

function singlePhrase(spec: FieldSpec, v: number): string {
  switch (spec.id) {
    case "minute":
      return `at minute ${v}`;
    case "hour":
      return `at hour ${v}`;
    case "day-of-month":
      return `on day ${v}`;
    case "month":
      return `in ${valueName(spec, v)}`;
    case "day-of-week":
      return `on ${valueName(spec, v)}`;
  }
}

function rangePhrase(spec: FieldSpec, lo: number, hi: number): string {
  switch (spec.id) {
    case "minute":
      return `minutes ${lo} through ${hi}`;
    case "hour":
      return `hours ${lo} through ${hi}`;
    case "day-of-month":
      return `days ${lo} through ${hi}`;
    case "month":
    case "day-of-week":
      return `${valueName(spec, lo)} through ${valueName(spec, hi)}`;
  }
}

function matchesText(spec: FieldSpec, values: number[]): string {
  const fullCount = spec.id === "day-of-week" ? 7 : spec.max - spec.min + 1;
  if (values.length === fullCount) {
    const hi = spec.id === "day-of-week" ? 6 : spec.max;
    return `${spec.min}–${hi} (all)`;
  }
  const display = values.map((v) => valueName(spec, v));
  if (display.length <= 12) return display.join(", ");
  return `${display.slice(0, 6).join(", ")} … (${values.length} values)`;
}

function joinPhrases(phrases: string[]): string {
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0] ?? "";
  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1] ?? ""}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}
