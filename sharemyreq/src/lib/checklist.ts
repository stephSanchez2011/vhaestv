import type {
  ChecklistItem,
  DiffChange,
  HeaderMap,
  RequestSnapshot,
  RequestVersion,
} from "./types";

const SENSITIVE_HEADER_RE =
  /^(authorization|cookie|set-cookie|x-api-key|api-key|proxy-authorization)$/i;

export function maskHeaders(headers: HeaderMap): HeaderMap {
  const masked: HeaderMap = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER_RE.test(key)) {
      masked[key] = value ? "••••••••" : "";
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export function normalizeHeaders(raw: string | HeaderMap): HeaderMap {
  if (typeof raw !== "string") {
    const cleaned: HeaderMap = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key.trim()) cleaned[key.trim()] = String(value ?? "").trim();
    }
    return cleaned;
  }

  const headers: HeaderMap = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) headers[key] = value;
  }
  return headers;
}

export function headersToText(headers: HeaderMap): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function hasHeader(headers: HeaderMap, name: string): boolean {
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
}

function getHeader(headers: HeaderMap, name: string): string | undefined {
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );
  return entry?.[1];
}

export function buildChecklist(snapshot: RequestSnapshot): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const { method, url, status, requestHeaders, requestBody } = snapshot;

  try {
    // eslint-disable-next-line no-new
    new URL(url);
    items.push({
      id: "url",
      label: "URL valide",
      status: "ok",
      detail: url,
    });
  } catch {
    items.push({
      id: "url",
      label: "URL valide",
      status: "fail",
      detail: "L’URL n’est pas parseable.",
    });
  }

  items.push({
    id: "method",
    label: "Méthode HTTP",
    status: "info",
    detail: method,
  });

  if (status == null) {
    items.push({
      id: "status",
      label: "Status HTTP",
      status: "warn",
      detail: "Aucun status renseigné (front seul / mock).",
    });
  } else if (status >= 200 && status < 300) {
    items.push({
      id: "status",
      label: "Status HTTP",
      status: "ok",
      detail: `${status} — succès`,
    });
  } else if (status >= 400) {
    items.push({
      id: "status",
      label: "Status HTTP",
      status: "fail",
      detail: `${status} — erreur client/serveur`,
    });
  } else {
    items.push({
      id: "status",
      label: "Status HTTP",
      status: "warn",
      detail: `${status}`,
    });
  }

  const auth = getHeader(requestHeaders, "Authorization");
  if (!auth) {
    items.push({
      id: "auth",
      label: "Authorization",
      status: "warn",
      detail: "Header absent (OK si endpoint public).",
    });
  } else if (/^bearer\s+\S+/i.test(auth)) {
    items.push({
      id: "auth",
      label: "Authorization",
      status: "ok",
      detail: "Bearer token présent.",
    });
  } else {
    items.push({
      id: "auth",
      label: "Authorization",
      status: "warn",
      detail: "Présent, format non Bearer.",
    });
  }

  const contentType = getHeader(requestHeaders, "Content-Type");
  const methodsWithBody = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  if (methodsWithBody.has(method)) {
    if (!contentType) {
      items.push({
        id: "content-type",
        label: "Content-Type",
        status: "fail",
        detail: "Manquant alors qu’une body est attendue.",
      });
    } else if (/application\/json/i.test(contentType)) {
      items.push({
        id: "content-type",
        label: "Content-Type",
        status: "ok",
        detail: contentType,
      });
    } else {
      items.push({
        id: "content-type",
        label: "Content-Type",
        status: "warn",
        detail: contentType,
      });
    }
  } else {
    items.push({
      id: "content-type",
      label: "Content-Type",
      status: "info",
      detail: contentType || "Non requis pour cette méthode.",
    });
  }

  if (methodsWithBody.has(method) && requestBody.trim()) {
    if (contentType && /application\/json/i.test(contentType)) {
      try {
        JSON.parse(requestBody);
        items.push({
          id: "body-json",
          label: "Body JSON",
          status: "ok",
          detail: "JSON valide.",
        });
      } catch {
        items.push({
          id: "body-json",
          label: "Body JSON",
          status: "fail",
          detail: "Content-Type JSON mais body invalide.",
        });
      }
    } else {
      items.push({
        id: "body-json",
        label: "Body",
        status: "info",
        detail: "Body présent.",
      });
    }
  } else if (methodsWithBody.has(method)) {
    items.push({
      id: "body-json",
      label: "Body",
      status: "warn",
      detail: "Body vide pour une méthode qui envoie souvent des données.",
    });
  }

  if (!hasHeader(requestHeaders, "Accept")) {
    items.push({
      id: "accept",
      label: "Accept",
      status: "info",
      detail: "Optionnel, utile pour API JSON.",
    });
  } else {
    items.push({
      id: "accept",
      label: "Accept",
      status: "ok",
      detail: getHeader(requestHeaders, "Accept") || "",
    });
  }

  return items;
}

export function checklistScore(items: ChecklistItem[]): {
  ok: number;
  warn: number;
  fail: number;
  tone: "ok" | "warn" | "fail";
} {
  const ok = items.filter((i) => i.status === "ok").length;
  const warn = items.filter((i) => i.status === "warn").length;
  const fail = items.filter((i) => i.status === "fail").length;
  const tone = fail > 0 ? "fail" : warn > 0 ? "warn" : "ok";
  return { ok, warn, fail, tone };
}

function flattenSnapshot(snapshot: RequestSnapshot): Record<string, string> {
  const flat: Record<string, string> = {
    method: snapshot.method,
    url: snapshot.url,
    status: snapshot.status == null ? "" : String(snapshot.status),
    statusText: snapshot.statusText,
    durationMs:
      snapshot.durationMs == null ? "" : String(snapshot.durationMs),
    requestBody: snapshot.requestBody,
    responseBody: snapshot.responseBody,
    note: snapshot.note,
  };

  for (const [key, value] of Object.entries(snapshot.requestHeaders)) {
    flat[`req.header.${key}`] = value;
  }
  for (const [key, value] of Object.entries(snapshot.responseHeaders)) {
    flat[`res.header.${key}`] = value;
  }

  return flat;
}

export function diffVersions(
  before: RequestVersion | undefined,
  after: RequestVersion,
): DiffChange[] {
  if (!before) return [];

  const a = flattenSnapshot(before.snapshot);
  const b = flattenSnapshot(after.snapshot);
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
  const changes: DiffChange[] = [];

  for (const key of keys) {
    const left = a[key] ?? "";
    const right = b[key] ?? "";
    if (left === right) continue;

    if (!left && right) {
      changes.push({ path: key, before: left, after: right, kind: "added" });
    } else if (left && !right) {
      changes.push({ path: key, before: left, after: right, kind: "removed" });
    } else {
      changes.push({ path: key, before: left, after: right, kind: "changed" });
    }
  }

  return changes;
}

export function emptySnapshot(): RequestSnapshot {
  return {
    method: "GET",
    url: "https://",
    status: null,
    statusText: "",
    durationMs: null,
    requestHeaders: {},
    responseHeaders: {},
    requestBody: "",
    responseBody: "",
    note: "",
  };
}
