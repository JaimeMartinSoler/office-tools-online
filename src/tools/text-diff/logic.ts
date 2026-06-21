import { err, ok, type Result } from "@/lib/result";

export type SegmentType = "equal" | "insert" | "delete";

export interface Segment {
  type: SegmentType;
  text: string;
}

/** One side of a diff row: its 1-based line number and inline segments. */
export interface Cell {
  lineNo: number;
  segments: Segment[];
}

export type RowType = "equal" | "insert" | "delete" | "modify";

export interface Row {
  type: RowType;
  left: Cell | null;
  right: Cell | null;
}

export interface DiffResult {
  rows: Row[];
  additions: number;
  deletions: number;
  /** True when the two inputs are identical after any normalisation. */
  identical: boolean;
}

export type DiffMode = "text" | "json";

/** Above this combined length, skip intra-line char diffing for performance. */
const INLINE_LIMIT = 5000;

interface LineOp {
  type: "equal" | "delete" | "insert";
  aIndex?: number;
  bIndex?: number;
}

/**
 * Classic LCS line diff: returns an ordered op stream describing how to turn
 * `a` into `b` (equal / delete from a / insert from b).
 */
function diffLines(a: string[], b: string[]): LineOp[] {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a[i:] and b[j:].
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        a[i] === b[j]
          ? dp[i + 1]![j + 1]! + 1
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const ops: LineOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", aIndex: i, bIndex: j });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      ops.push({ type: "delete", aIndex: i });
      i++;
    } else {
      ops.push({ type: "insert", bIndex: j });
      j++;
    }
  }
  while (i < n) ops.push({ type: "delete", aIndex: i++ });
  while (j < m) ops.push({ type: "insert", bIndex: j++ });
  return ops;
}

/** Merge adjacent segments of the same type so output stays compact. */
function coalesce(segments: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const seg of segments) {
    if (seg.text === "") continue;
    const last = out[out.length - 1];
    if (last && last.type === seg.type) last.text += seg.text;
    else out.push({ ...seg });
  }
  return out;
}

/**
 * Character-level LCS diff between two lines, returned split into the segments
 * shown on the left (equal + delete) and right (equal + insert).
 */
export function diffChars(
  a: string,
  b: string,
): { left: Segment[]; right: Segment[] } {
  if (a.length + b.length > INLINE_LIMIT) {
    return {
      left: a ? [{ type: "delete", text: a }] : [],
      right: b ? [{ type: "insert", text: b }] : [],
    };
  }
  const ac = Array.from(a);
  const bc = Array.from(b);
  const n = ac.length;
  const m = bc.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        ac[i] === bc[j]
          ? dp[i + 1]![j + 1]! + 1
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const left: Segment[] = [];
  const right: Segment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ac[i] === bc[j]) {
      left.push({ type: "equal", text: ac[i]! });
      right.push({ type: "equal", text: bc[j]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      left.push({ type: "delete", text: ac[i]! });
      i++;
    } else {
      right.push({ type: "insert", text: bc[j]! });
      j++;
    }
  }
  while (i < n) left.push({ type: "delete", text: ac[i++]! });
  while (j < m) right.push({ type: "insert", text: bc[j++]! });
  return { left: coalesce(left), right: coalesce(right) };
}

function plainCell(lineNo: number, text: string, type: SegmentType): Cell {
  return { lineNo, segments: [{ type, text }] };
}

/**
 * Turn a run of deletes and inserts into aligned rows: matching positions become
 * `modify` rows (with inline char diff), leftovers become pure delete/insert.
 */
function pairRun(
  deletes: { lineNo: number; text: string }[],
  inserts: { lineNo: number; text: string }[],
  rows: Row[],
): void {
  const paired = Math.min(deletes.length, inserts.length);
  for (let k = 0; k < paired; k++) {
    const del = deletes[k]!;
    const ins = inserts[k]!;
    const inline = diffChars(del.text, ins.text);
    rows.push({
      type: "modify",
      left: { lineNo: del.lineNo, segments: inline.left },
      right: { lineNo: ins.lineNo, segments: inline.right },
    });
  }
  for (let k = paired; k < deletes.length; k++) {
    const del = deletes[k]!;
    rows.push({
      type: "delete",
      left: plainCell(del.lineNo, del.text, "delete"),
      right: null,
    });
  }
  for (let k = paired; k < inserts.length; k++) {
    const ins = inserts[k]!;
    rows.push({
      type: "insert",
      left: null,
      right: plainCell(ins.lineNo, ins.text, "insert"),
    });
  }
}

/** Re-serialise JSON with sorted keys and 2-space indent for structural diff. */
function normalizeJson(input: string, side: string): Result<string> {
  try {
    const value = JSON.parse(input);
    return ok(stableStringify(value));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(`The ${side} is not valid JSON: ${message}`);
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value), null, 2);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/**
 * Compute a side-by-side diff between two inputs. In `json` mode both sides are
 * normalised (sorted keys, re-indented) first, so only structural/value
 * differences remain.
 */
export function computeDiff(
  original: string,
  changed: string,
  mode: DiffMode,
): Result<DiffResult> {
  let a = original;
  let b = changed;
  if (mode === "json") {
    const na = normalizeJson(original, "original");
    if (!na.ok) return na;
    const nb = normalizeJson(changed, "changed");
    if (!nb.ok) return nb;
    a = na.value;
    b = nb.value;
  }

  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const ops = diffLines(aLines, bLines);

  const rows: Row[] = [];
  let pendingDel: { lineNo: number; text: string }[] = [];
  let pendingIns: { lineNo: number; text: string }[] = [];
  let additions = 0;
  let deletions = 0;

  const flush = () => {
    if (pendingDel.length || pendingIns.length) {
      deletions += pendingDel.length;
      additions += pendingIns.length;
      pairRun(pendingDel, pendingIns, rows);
      pendingDel = [];
      pendingIns = [];
    }
  };

  for (const op of ops) {
    if (op.type === "equal") {
      flush();
      const text = aLines[op.aIndex!]!;
      rows.push({
        type: "equal",
        left: plainCell(op.aIndex! + 1, text, "equal"),
        right: plainCell(op.bIndex! + 1, text, "equal"),
      });
    } else if (op.type === "delete") {
      pendingDel.push({ lineNo: op.aIndex! + 1, text: aLines[op.aIndex!]! });
    } else {
      pendingIns.push({ lineNo: op.bIndex! + 1, text: bLines[op.bIndex!]! });
    }
  }
  flush();

  return ok({
    rows,
    additions,
    deletions,
    identical: additions === 0 && deletions === 0,
  });
}
