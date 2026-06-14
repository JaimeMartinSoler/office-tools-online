import { describe, expect, it } from "vitest";
import { explainCron } from "./logic";

function fields(input: string, mode: "standard" | "extended" = "standard") {
  const result = explainCron(input, mode);
  if (!result.ok) throw new Error(`expected ok, got error: ${result.error}`);
  return result.value.fields;
}

describe("explainCron — standard", () => {
  it("explains every field of `* * * * *`", () => {
    const f = fields("* * * * *");
    expect(f).toHaveLength(5);
    expect(f[0]).toMatchObject({
      label: "Minute",
      periodicity: "Every minute",
      matches: "0–59 (all)",
    });
    expect(f[1]?.periodicity).toBe("Every hour");
    expect(f[2]?.periodicity).toBe("Every day");
    expect(f[3]?.periodicity).toBe("Every month");
    expect(f[4]).toMatchObject({
      label: "Day of week",
      periodicity: "Every day of the week",
      matches: "0–6 (all)",
    });
  });

  it("handles steps, ranges, and numeric day-of-week", () => {
    const f = fields("*/15 9-17 * * 1-5");
    expect(f[0]).toMatchObject({
      periodicity: "Every 15 minutes",
      matches: "0, 15, 30, 45",
    });
    expect(f[1]).toMatchObject({
      periodicity: "Hours 9 through 17",
      matches: "9, 10, 11, 12, 13, 14, 15, 16, 17",
    });
    // Day names are shown even when the input is numeric.
    expect(f[4]).toMatchObject({
      periodicity: "Monday through Friday",
      matches: "Monday, Tuesday, Wednesday, Thursday, Friday",
    });
  });

  it("handles a comma list", () => {
    const f = fields("0,30 * * * *");
    expect(f[0]).toMatchObject({
      periodicity: "At minute 0 and at minute 30",
      matches: "0, 30",
    });
  });

  it("handles a stepped range `0-30/10`", () => {
    const f = fields("0-30/10 * * * *");
    expect(f[0]).toMatchObject({
      periodicity: "Every 10 minutes from 0 through 30",
      matches: "0, 10, 20, 30",
    });
  });

  it("treats day-of-week 0 and 7 both as Sunday", () => {
    expect(fields("0 0 * * 0")[4]?.matches).toBe("Sunday");
    expect(fields("0 0 * * 7")[4]?.matches).toBe("Sunday");
  });
});

describe("explainCron — extended (macros + names)", () => {
  it("accepts day-of-week names", () => {
    const f = fields("0 9 * * MON-FRI", "extended");
    expect(f[4]?.periodicity).toBe("Monday through Friday");
  });

  it("accepts month names", () => {
    const f = fields("0 0 1 JAN *", "extended");
    expect(f[3]).toMatchObject({ periodicity: "In January", matches: "January" });
  });

  it("expands @daily to the same fields as `0 0 * * *`", () => {
    const macro = explainCron("@daily", "extended");
    const explicit = explainCron("0 0 * * *", "extended");
    expect(macro.ok && explicit.ok).toBe(true);
    if (macro.ok && explicit.ok) {
      expect(macro.value.fields).toEqual(explicit.value.fields);
    }
  });
});

describe("explainCron — errors", () => {
  function error(input: string, mode: "standard" | "extended" = "standard") {
    const result = explainCron(input, mode);
    expect(result.ok).toBe(false);
    return result.ok ? "" : result.error;
  }

  it("rejects the wrong field count", () => {
    expect(error("* * * *")).toMatch(/Expected 5 fields/);
  });

  it("rejects out-of-range values", () => {
    expect(error("60 * * * *")).toMatch(/out of range/);
  });

  it("rejects names in standard mode", () => {
    expect(error("0 0 * * MON")).toMatch(/Macros \+ Names mode/);
  });

  it("rejects macros in standard mode", () => {
    expect(error("@daily")).toMatch(/Macros \+ Names mode/);
  });

  it("rejects a reversed range", () => {
    expect(error("5-1 * * * *")).toMatch(/after the end/);
  });

  it("rejects a zero step", () => {
    expect(error("*/0 * * * *")).toMatch(/at least 1/);
  });

  it("explains that @reboot has no schedule", () => {
    expect(error("@reboot", "extended")).toMatch(/startup/);
  });
});
