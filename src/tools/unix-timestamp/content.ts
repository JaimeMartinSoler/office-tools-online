import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Converts a Unix epoch timestamp into a readable date, or a date back into a timestamp. Each result shows the instant seven ways: Unix seconds, Unix milliseconds, ISO 8601 in UTC and in your time zone, the UTC and local date strings, and a relative phrase such as \"in 3 days\". In **Auto** mode, the tool reads 13-digit values as milliseconds (JavaScript's `Date.now()`) and 10-digit values as seconds.",
  steps: [
    "Choose **Timestamp → Date** or **Date → Timestamp**.",
    "For timestamps, leave the unit on **Auto**, or force **Seconds** or **Milliseconds**.",
    "Paste the value: a number like `1718323200`, or a date such as `2024-06-14T09:30:00+02:00`.",
    "Copy whichever representation you need from the **Result** list.",
  ],
  examples: [
    {
      title: "A 10-digit timestamp in seconds",
      note: "Timestamp → Date · Auto. The local rows depend on your time zone; these were produced in UTC.",
      input: "1718323200",
      output:
        "Unix (seconds)       1718323200\nUnix (milliseconds)  1718323200000\nISO 8601 (UTC)       2024-06-14T00:00:00.000Z\nUTC                  Fri, 14 Jun 2024 00:00:00 GMT",
    },
    {
      title: "A 13-digit JavaScript timestamp",
      note: "Timestamp → Date · Auto. The value is at least 10^11, so it's read as milliseconds and the `.123` survives in the ISO form.",
      input: "1718323200123",
      output: "Unix (seconds)       1718323200\nUnix (milliseconds)  1718323200123\nISO 8601 (UTC)       2024-06-14T00:00:00.123Z",
    },
    {
      title: "A date with a UTC offset to a timestamp",
      note: "Date → Timestamp. 09:30 at +02:00 is 07:30 UTC.",
      input: "2024-06-14T09:30:00+02:00",
      output: "Unix (seconds)       1718350200\nUnix (milliseconds)  1718350200000\nISO 8601 (UTC)       2024-06-14T07:30:00.000Z",
    },
    {
      title: "The year-2038 limit",
      note: "Timestamp → Date · Auto. The largest value a signed 32-bit `time_t` can hold.",
      input: "2147483647",
      output: "ISO 8601 (UTC)       2038-01-19T03:14:07.000Z\nUTC                  Tue, 19 Jan 2038 03:14:07 GMT",
    },
  ],
  faq: [
    {
      question: "Is a Unix timestamp in seconds or milliseconds?",
      answer:
        "Classic Unix time — `date +%s`, most databases, and JWT `exp` claims — counts seconds. JavaScript, Java's `System.currentTimeMillis()` and many JSON APIs use milliseconds. Present-day values are 10 digits in seconds and 13 in milliseconds, which is how **Auto** tells them apart. Its threshold of 10^11 works for any date from March 1973 onward.",
    },
    {
      question: "Does a Unix timestamp have a time zone?",
      answer:
        "No. It counts seconds since 1970-01-01 00:00:00 UTC, so the same number means the same instant everywhere. Time zones only matter when the instant is displayed, which is why the tool shows both a UTC row and a local row taken from your browser's time zone.",
    },
    {
      question: "Which date formats can I convert to a timestamp?",
      answer:
        "Anything your browser's `Date.parse` accepts. ISO 8601 is the reliable choice: `2024-06-14T09:30:00Z` or `2024-06-14T09:30:00+02:00`. Be careful with defaults: a date-only ISO string like `2024-06-14` is read as midnight UTC, but a date-time without an offset (`2024-06-14T09:30`) is read as your local time.",
    },
    {
      question: "What is the year 2038 problem?",
      answer:
        "Systems that store Unix time in a signed 32-bit integer overflow after `2147483647`, which is 2038-01-19 03:14:07 UTC, and wrap around to 1901. This converter uses JavaScript's 64-bit numbers, so it handles dates far past 2038. The example above shows the exact limit, which is useful when testing legacy code.",
    },
    {
      question: "Can timestamps be negative or have decimals?",
      answer:
        "Yes. Negative values are dates before 1970: `-86400` in seconds is 1969-12-31T00:00:00Z. A decimal such as `1718323200.5` is accepted, and any precision below one millisecond is dropped. Anything else, such as `2024-06-14` typed in Timestamp → Date mode, is rejected as not a number — switch to Date → Timestamp for dates.",
    },
  ],
  related:
    "JWT `iat`, `nbf` and `exp` claims are Unix seconds, and the [JWT Inspector](/tools/jwt-inspector/) converts them for you in context. For recurring schedules rather than single instants, the [Cron Expression Explainer](/tools/cron-expression/) spells out which minutes and hours a crontab line matches.",
};
