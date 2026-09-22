import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Explains a standard five-field cron expression (minute, hour, day of month, month, day of week) one field at a time. For each field it gives a plain-English rule and the exact values it matches. It understands `*`, ranges (`9-17`), lists (`1,15`) and steps (`*/15`, `1-10/3`), and treats day-of-week `7` as Sunday, like `0`. **Macros + Names** mode also accepts `@daily`-style macros and `JAN`–`DEC` / `SUN`–`SAT` names.",
  steps: [
    "Choose **Standard** for numeric crontab syntax, or **Macros + Names** to also allow `@weekly`, `MON` and `JAN`.",
    "Paste the five fields, for example `*/15 9-17 * * 1-5`.",
    "Read the **Schedule** table: each field's rule and the values it matches.",
    "Fix any field the error names, then copy the table if you want it for a code review or runbook.",
  ],
  examples: [
    {
      title: "Every 15 minutes during office hours on weekdays",
      note: "Standard. The hour range 9-17 includes 17, so the last run is at 17:45.",
      input: "*/15 9-17 * * 1-5",
      output:
        "Minute        */15  Every 15 minutes         0, 15, 30, 45\nHour          9-17  Hours 9 through 17       9, 10, 11, 12, 13, 14, 15, 16, 17\nDay of month  *     Every day                1–31 (all)\nMonth         *     Every month              1–12 (all)\nDay of week   1-5   Monday through Friday    Monday, Tuesday, Wednesday, Thursday, Friday",
    },
    {
      title: "Midnight on the first of every month",
      note: "Standard. The same schedule as the `@monthly` macro.",
      input: "0 0 1 * *",
      output:
        "Minute        0  At minute 0            0\nHour          0  At hour 0              0\nDay of month  1  On day 1               1\nMonth         *  Every month            1–12 (all)\nDay of week   *  Every day of the week  0–6 (all)",
    },
    {
      title: "Names instead of numbers",
      note: "Macros + Names. 02:30 on Sundays in January and July.",
      input: "30 2 * JAN,JUL SUN",
      output:
        "Minute        30       At minute 30            30\nHour          2        At hour 2               2\nDay of month  *        Every day               1–31 (all)\nMonth         JAN,JUL  In January and in July  January, July\nDay of week   SUN      On Sunday               Sunday",
    },
    {
      title: "A stepped range",
      note: "Standard. `1-10/3` starts at 1 and takes every third day up to 10.",
      input: "5 4 1-10/3 * *",
      output: "Day of month  1-10/3  Every 3 days from 1 through 10  1, 4, 7, 10",
    },
  ],
  faq: [
    {
      question: "What do the five fields mean?",
      answer:
        "In order: minute (0–59), hour (0–23), day of month (1–31), month (1–12), and day of week (0–7, where both 0 and 7 are Sunday). A job runs when the current time matches the minute, hour and month fields, and the day fields. Hours use the 24-hour clock in the time zone of the machine running cron.",
    },
    {
      question: "Does it support seconds or Quartz syntax like ? and L?",
      answer:
        "No. It explains the classic five-field format used by crontab, Kubernetes CronJobs and GitHub Actions. Six- and seven-field Quartz or Spring expressions (with a seconds field, `?`, `L`, `W` or `#`) are rejected with an error naming the field count or the invalid value, rather than being misread.",
    },
    {
      question: "What happens if I set both day of month and day of week?",
      answer:
        "The tool explains each field separately. Be aware that standard cron (Vixie cron and its descendants) runs the job when either day field matches, not both, if both are restricted. `0 0 13 * 5` therefore runs on every 13th and on every Friday, not only on Friday the 13th.",
    },
    {
      question: "Which macros are supported?",
      answer:
        "In **Macros + Names** mode: `@yearly` and `@annually` (0 0 1 1 *), `@monthly` (0 0 1 * *), `@weekly` (0 0 * * 0), `@daily` and `@midnight` (0 0 * * *), and `@hourly` (0 * * * *). `@reboot` is recognised but has no schedule to explain, because it runs once at startup.",
    },
    {
      question: "Does it show the next run times?",
      answer:
        "No. It lists which values each field matches, but it doesn't compute calendar dates, because the next run depends on the server's time zone and the day-field rule above. The matched-values column is usually enough to spot a wrong range or a step that doesn't divide evenly.",
    },
  ],
  related:
    "To turn a timestamp from a job's log into a readable date, or a planned run time into epoch seconds for a test, use the [Unix Timestamp Converter](/tools/unix-timestamp/). Scheduler configs often live in YAML, which the [JSON Formatter & Converter](/tools/json-yaml-xml/) converts to and from JSON.",
};
