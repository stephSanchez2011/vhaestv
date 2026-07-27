import type { HttpMethod, RequestSnapshot } from "./types";
import { normalizeHeaders } from "./checklist";
import { formFromSnapshot, type RequestFormValues } from "./form";

function toBase64(value: string): string {
  if (typeof btoa === "function") {
    return btoa(value);
  }
  return Buffer.from(value).toString("base64");
}

function fromBase64(value: string): string {
  if (typeof atob === "function") {
    return atob(value);
  }
  return Buffer.from(value, "base64").toString("utf8");
}

const METHODS = new Set<HttpMethod>([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

export type ImportResult =
  | { ok: true; kind: "curl" | "har"; snapshot: RequestSnapshot }
  | { ok: false; error: string };

function asMethod(value: string | undefined, fallback: HttpMethod = "GET"): HttpMethod {
  const upper = (value || fallback).toUpperCase();
  return METHODS.has(upper as HttpMethod) ? (upper as HttpMethod) : fallback;
}

function headersFromPairs(
  pairs: Array<{ name?: string; value?: string } | undefined>,
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const pair of pairs) {
    if (!pair?.name) continue;
    headers[pair.name] = pair.value ?? "";
  }
  return headers;
}

function decodeMaybeJsonBody(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return text;
  }
}

function tokenizeCurl(input: string): string[] {
  const normalized = input
    .replace(/\\\r?\n/g, " ")
    .replace(/\r\n/g, "\n")
    .trim();

  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];

    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === "\\" && quote === '"' && i + 1 < normalized.length) {
        current += normalized[i + 1];
        i += 1;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

export function parseCurl(input: string): ImportResult {
  const tokens = tokenizeCurl(input);
  if (tokens.length === 0 || tokens[0].toLowerCase() !== "curl") {
    return { ok: false, error: "Ce n’est pas une commande curl (doit commencer par curl)." };
  }

  let method: HttpMethod | null = null;
  let url = "";
  const headers: Record<string, string> = {};
  const dataParts: string[] = [];
  let explicitJson = false;

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];

    const takeNext = () => {
      i += 1;
      return tokens[i];
    };

    if (token === "-X" || token === "--request") {
      method = asMethod(takeNext(), "GET");
      continue;
    }

    if (token === "-H" || token === "--header") {
      const raw = takeNext() || "";
      const idx = raw.indexOf(":");
      if (idx > -1) {
        headers[raw.slice(0, idx).trim()] = raw.slice(idx + 1).trim();
      }
      continue;
    }

    if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--data-ascii"
    ) {
      dataParts.push(takeNext() || "");
      continue;
    }

    if (token === "--json") {
      explicitJson = true;
      dataParts.push(takeNext() || "");
      continue;
    }

    if (token === "-A" || token === "--user-agent") {
      headers["User-Agent"] = takeNext() || "";
      continue;
    }

    if (token === "-u" || token === "--user") {
      const user = takeNext() || "";
      headers.Authorization = `Basic ${toBase64(user)}`;
      continue;
    }

    if (token === "--url") {
      url = takeNext() || "";
      continue;
    }

    if (token.startsWith("-")) {
      // Ignore unsupported flags / their optional values when glued.
      if (
        token === "-I" ||
        token === "--head" ||
        token === "-i" ||
        token === "--include" ||
        token === "-k" ||
        token === "--insecure" ||
        token === "-L" ||
        token === "--location" ||
        token === "-s" ||
        token === "--silent" ||
        token === "-v" ||
        token === "--verbose" ||
        token === "-N" ||
        token === "--no-buffer"
      ) {
        if (token === "-I" || token === "--head") method = "HEAD";
        continue;
      }
      // Flags with values we don't care about
      if (
        token === "-o" ||
        token === "--output" ||
        token === "-e" ||
        token === "--referer" ||
        token === "--max-time" ||
        token === "-m" ||
        token === "--connect-timeout"
      ) {
        takeNext();
      }
      continue;
    }

    if (!url) {
      url = token;
    }
  }

  if (!url) {
    return { ok: false, error: "Impossible de trouver l’URL dans le curl." };
  }

  const body = dataParts.join("&");
  if (explicitJson && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  const inferredMethod = method || (body ? "POST" : "GET");

  return {
    ok: true,
    kind: "curl",
    snapshot: {
      method: inferredMethod,
      url,
      status: null,
      statusText: "",
      durationMs: null,
      requestHeaders: normalizeHeaders(headers),
      responseHeaders: {},
      requestBody: decodeMaybeJsonBody(body),
      responseBody: "",
      note: "Importé depuis curl",
    },
  };
}

type HarLike = {
  log?: {
    entries?: Array<{
      time?: number;
      request?: {
        method?: string;
        url?: string;
        headers?: Array<{ name?: string; value?: string }>;
        postData?: { text?: string; mimeType?: string };
      };
      response?: {
        status?: number;
        statusText?: string;
        headers?: Array<{ name?: string; value?: string }>;
        content?: { text?: string; encoding?: string; mimeType?: string };
      };
    }>;
  };
  // Some tools paste a single entry
  request?: HarLike["log"] extends infer _ ? NonNullable<NonNullable<HarLike["log"]>["entries"]>[number]["request"] : never;
  response?: HarLike["log"] extends infer _ ? NonNullable<NonNullable<HarLike["log"]>["entries"]>[number]["response"] : never;
  time?: number;
};

export function parseHar(input: string): ImportResult {
  let parsed: HarLike;
  try {
    parsed = JSON.parse(input) as HarLike;
  } catch {
    return { ok: false, error: "JSON HAR invalide." };
  }

  const entry =
    parsed.log?.entries?.[0] ||
    (parsed.request
      ? {
          request: parsed.request,
          response: parsed.response,
          time: parsed.time,
        }
      : null);

  const url = entry?.request?.url;
  if (!entry?.request || !url) {
    return {
      ok: false,
      error: "HAR sans entrée utilisable (log.entries[0] manquant).",
    };
  }

  const req = entry.request;
  const res = entry.response;
  let responseBody = res?.content?.text || "";
  if (res?.content?.encoding === "base64" && responseBody) {
    try {
      responseBody = fromBase64(responseBody);
    } catch {
      // keep raw
    }
  }

  const requestHeaders = headersFromPairs(req.headers || []);
  if (
    req.postData?.mimeType &&
    !Object.keys(requestHeaders).some((k) => k.toLowerCase() === "content-type")
  ) {
    requestHeaders["Content-Type"] = req.postData.mimeType;
  }

  return {
    ok: true,
    kind: "har",
    snapshot: {
      method: asMethod(req.method, "GET"),
      url,
      status: typeof res?.status === "number" ? res.status : null,
      statusText: res?.statusText || "",
      durationMs: typeof entry.time === "number" ? Math.round(entry.time) : null,
      requestHeaders: normalizeHeaders(requestHeaders),
      responseHeaders: normalizeHeaders(headersFromPairs(res?.headers || [])),
      requestBody: decodeMaybeJsonBody(req.postData?.text || ""),
      responseBody: decodeMaybeJsonBody(responseBody),
      note: "Importé depuis HAR",
    },
  };
}

export function parseImport(input: string): ImportResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Colle un curl ou un HAR pour importer." };
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseHar(trimmed);
  }

  if (/^curl\b/i.test(trimmed)) {
    return parseCurl(trimmed);
  }

  // Heuristic: if it looks like JSON HAR fragment failure already handled
  return {
    ok: false,
    error: "Format non reconnu. Colle une commande curl ou un export HAR (JSON).",
  };
}

export function applyImportToForm(
  values: RequestFormValues,
  snapshot: RequestSnapshot,
): RequestFormValues {
  const next = formFromSnapshot(snapshot, {
    title: values.title,
    studentLabel: values.studentLabel,
  });
  return {
    ...next,
    note: values.note || snapshot.note,
    afterFeedback: values.afterFeedback,
    title:
      values.title.trim() ||
      `${snapshot.method} ${safePath(snapshot.url)}`,
  };
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url;
  }
}
