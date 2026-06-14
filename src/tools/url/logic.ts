import { err, ok, type Result } from "@/lib/result";

/**
 * "component" → encodeURIComponent / decodeURIComponent: escapes everything
 * that isn't unreserved, suitable for a single query value or path segment.
 * "full" → encodeURI / decodeURI: leaves URL structure (`:/?#&=` etc.) intact,
 * suitable for encoding a whole URL.
 */
export type UrlVariant = "component" | "full";

/** Percent-encode text. */
export function encodeUrl(input: string, variant: UrlVariant): Result<string> {
  try {
    const encode = variant === "component" ? encodeURIComponent : encodeURI;
    return ok(encode(input));
  } catch (error) {
    // Thrown for lone surrogates ("URI malformed").
    const message = error instanceof Error ? error.message : String(error);
    return err(`Could not encode: ${message}`);
  }
}

/** Decode percent-encoded text. Returns an error for malformed input. */
export function decodeUrl(input: string, variant: UrlVariant): Result<string> {
  try {
    const decode = variant === "component" ? decodeURIComponent : decodeURI;
    return ok(decode(input));
  } catch {
    return err("Invalid percent-encoding — check for stray or truncated % sequences.");
  }
}

export interface QueryParam {
  key: string;
  value: string;
}

export interface UrlParts {
  protocol: string;
  host: string;
  path: string;
  hash: string;
}

export interface ParsedQuery {
  /** Present only when the input parsed as an absolute URL. */
  url: UrlParts | null;
  params: QueryParam[];
}

/**
 * Parse a full URL or a bare query string into decoded key/value params.
 * Accepts `https://host/path?a=1#frag`, `?a=1&b=2`, `a=1&b=2`, or `/page?a=1`.
 */
export function parseQuery(input: string): Result<ParsedQuery> {
  const trimmed = input.trim();
  if (trimmed === "") return err("Input is empty.");

  const asUrl = tryParseUrl(trimmed);
  if (asUrl) {
    return ok({
      url: {
        protocol: asUrl.protocol,
        host: asUrl.host,
        path: asUrl.pathname,
        hash: asUrl.hash,
      },
      params: paramsFrom(asUrl.searchParams),
    });
  }

  // Not an absolute URL — treat the input as a query string. Drop anything
  // before a "?" (e.g. a pasted "/page?a=1") and ignore a trailing #fragment.
  const queryStart = trimmed.indexOf("?");
  let query = queryStart >= 0 ? trimmed.slice(queryStart + 1) : trimmed;
  const hashStart = query.indexOf("#");
  if (hashStart >= 0) query = query.slice(0, hashStart);

  return ok({ url: null, params: paramsFrom(new URLSearchParams(query)) });
}

function tryParseUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    // `new URL` also accepts host-less schemes like "mailto:foo" — only treat
    // the input as a URL when it has an authority, otherwise fall through to
    // query-string parsing so "a=1&b=2" isn't mistaken for a URL.
    return url.host ? url : null;
  } catch {
    return null;
  }
}

function paramsFrom(search: URLSearchParams): QueryParam[] {
  const params: QueryParam[] = [];
  for (const [key, value] of search) {
    params.push({ key, value });
  }
  return params;
}
