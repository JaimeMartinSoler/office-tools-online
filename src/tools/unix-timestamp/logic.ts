import { err, ok, type Result } from "@/lib/result";

export type TimestampUnit = "seconds" | "milliseconds" | "auto";

/**
 * In "auto" mode, numbers whose magnitude is at or above this threshold are
 * read as milliseconds, otherwise as seconds. A modern Unix time in seconds is
 * ~1.7e9 (10 digits); in milliseconds it is ~1.7e12 (13 digits), so 1e11 sits
 * cleanly between the two for any date from the 1970s onward.
 */
const AUTO_MS_THRESHOLD = 1e11;

function toMillis(num: number, unit: TimestampUnit): number {
  if (unit === "milliseconds") return num;
  if (unit === "seconds") return num * 1000;
  return Math.abs(num) >= AUTO_MS_THRESHOLD ? num : num * 1000;
}

/** Parse a numeric Unix timestamp into a Date, interpreting it per `unit`. */
export function parseTimestamp(input: string, unit: TimestampUnit): Result<Date> {
  const trimmed = input.trim();
  if (trimmed === "") return err("Enter a Unix timestamp.");
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    return err(
      "Not a number — a Unix timestamp is digits only (e.g. 1718323200).",
    );
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return err("Number is too large to represent.");
  const date = new Date(toMillis(num, unit));
  if (Number.isNaN(date.getTime())) {
    return err("Timestamp is out of the representable date range.");
  }
  return ok(date);
}

/** Parse a human/ISO date string into a Date. */
export function parseDate(input: string): Result<Date> {
  const trimmed = input.trim();
  if (trimmed === "") return err("Enter a date.");
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) {
    return err(
      `Couldn't parse "${trimmed}" as a date. Try ISO 8601, e.g. 2024-06-14T00:00:00Z.`,
    );
  }
  return ok(new Date(ms));
}

function pad(n: number, len = 2): string {
  return String(Math.abs(n)).padStart(len, "0");
}

/** ISO 8601 string in the local timezone, e.g. 2024-06-14T02:00:00+02:00. */
export function toLocalISO(date: Date): string {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const zone =
    offsetMin === 0
      ? "Z"
      : `${sign}${pad(Math.floor(Math.abs(offsetMin) / 60))}:${pad(
          Math.abs(offsetMin) % 60,
        )}`;
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    zone
  );
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/** Human "5 minutes ago" / "in 3 days" relative to `nowMs`. */
export function relativeTime(ms: number, nowMs: number): string {
  const diffSec = Math.round((ms - nowMs) / 1000);
  if (Math.abs(diffSec) < 1) return "now";
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, secs] of RELATIVE_UNITS) {
    if (Math.abs(diffSec) >= secs || unit === "second") {
      return rtf.format(Math.round(diffSec / secs), unit);
    }
  }
  return "now";
}

export interface OutputRow {
  id: string;
  label: string;
  value: string;
}

/** All the labeled representations of a single instant. */
export function describe(date: Date, now: Date = new Date()): OutputRow[] {
  const ms = date.getTime();
  return [
    { id: "unix-seconds", label: "Unix (seconds)", value: String(Math.floor(ms / 1000)) },
    { id: "unix-millis", label: "Unix (milliseconds)", value: String(ms) },
    { id: "iso", label: "ISO 8601 (UTC)", value: date.toISOString() },
    { id: "iso-local", label: "ISO 8601 (local)", value: toLocalISO(date) },
    { id: "utc", label: "UTC", value: date.toUTCString() },
    { id: "local", label: "Local", value: date.toString() },
    { id: "relative", label: "Relative", value: relativeTime(ms, now.getTime()) },
  ];
}
