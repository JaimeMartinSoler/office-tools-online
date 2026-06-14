import { describe as group, expect, it } from "vitest";
import {
  describe,
  parseDate,
  parseTimestamp,
  relativeTime,
  toLocalISO,
} from "./logic";

group("parseTimestamp", () => {
  it("reads seconds", () => {
    const r = parseTimestamp("1718323200", "seconds");
    expect(r.ok && r.value.toISOString()).toBe("2024-06-14T00:00:00.000Z");
  });

  it("reads milliseconds", () => {
    const r = parseTimestamp("1718323200000", "milliseconds");
    expect(r.ok && r.value.toISOString()).toBe("2024-06-14T00:00:00.000Z");
  });

  it("auto-detects seconds vs milliseconds by magnitude", () => {
    const sec = parseTimestamp("1718323200", "auto");
    const ms = parseTimestamp("1718323200000", "auto");
    expect(sec.ok && sec.value.toISOString()).toBe("2024-06-14T00:00:00.000Z");
    expect(ms.ok && ms.value.toISOString()).toBe("2024-06-14T00:00:00.000Z");
  });

  it("handles the epoch and negative timestamps", () => {
    expect(parseTimestamp("0", "seconds")).toMatchObject({ ok: true });
    const neg = parseTimestamp("-1", "seconds");
    expect(neg.ok && neg.value.toISOString()).toBe("1969-12-31T23:59:59.000Z");
  });

  it("rejects non-numeric input", () => {
    expect(parseTimestamp("not-a-number", "seconds")).toMatchObject({
      ok: false,
    });
  });

  it("rejects empty input", () => {
    expect(parseTimestamp("   ", "seconds")).toMatchObject({ ok: false });
  });
});

group("parseDate", () => {
  it("parses ISO 8601", () => {
    const r = parseDate("2024-06-14T00:00:00Z");
    expect(r.ok && r.value.getTime()).toBe(Date.UTC(2024, 5, 14));
  });

  it("rejects unparseable input", () => {
    expect(parseDate("definitely not a date")).toMatchObject({ ok: false });
  });

  it("rejects empty input", () => {
    expect(parseDate("")).toMatchObject({ ok: false });
  });
});

group("relativeTime", () => {
  const now = Date.UTC(2024, 0, 1, 0, 0, 0);
  it("describes the past", () => {
    expect(relativeTime(now - 5 * 60_000, now)).toBe("5 minutes ago");
  });
  it("describes the future", () => {
    expect(relativeTime(now + 3 * 24 * 3600_000, now)).toBe("in 3 days");
  });
  it("collapses tiny diffs to now", () => {
    expect(relativeTime(now, now)).toBe("now");
  });
});

group("toLocalISO", () => {
  it("round-trips back to the same instant regardless of timezone", () => {
    const date = new Date(Date.UTC(2024, 5, 14, 12, 30, 15));
    expect(Date.parse(toLocalISO(date))).toBe(date.getTime());
  });
});

group("describe", () => {
  it("produces UTC-stable rows", () => {
    const rows = describe(new Date("2024-06-14T00:00:00Z"), new Date("2024-06-14T00:00:00Z"));
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.value]));
    expect(byId["unix-seconds"]).toBe("1718323200");
    expect(byId["unix-millis"]).toBe("1718323200000");
    expect(byId["iso"]).toBe("2024-06-14T00:00:00.000Z");
    expect(byId["relative"]).toBe("now");
  });
});
