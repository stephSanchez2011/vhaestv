import type { RequestSnapshot } from "./types";
import { normalizeHeaders } from "./checklist";

export type RequestFormValues = {
  title: string;
  studentLabel: string;
  method: RequestSnapshot["method"];
  url: string;
  status: string;
  statusText: string;
  durationMs: string;
  requestHeadersText: string;
  responseHeadersText: string;
  requestBody: string;
  responseBody: string;
  note: string;
  afterFeedback: boolean;
};

export function snapshotFromForm(values: RequestFormValues): RequestSnapshot {
  const statusRaw = values.status.trim();
  const durationRaw = values.durationMs.trim();

  return {
    method: values.method,
    url: values.url.trim(),
    status: statusRaw === "" ? null : Number(statusRaw),
    statusText: values.statusText.trim(),
    durationMs: durationRaw === "" ? null : Number(durationRaw),
    requestHeaders: normalizeHeaders(values.requestHeadersText),
    responseHeaders: normalizeHeaders(values.responseHeadersText),
    requestBody: values.requestBody,
    responseBody: values.responseBody,
    note: values.note.trim(),
  };
}

export function formFromSnapshot(
  snapshot: RequestSnapshot,
  meta?: { title?: string; studentLabel?: string },
): RequestFormValues {
  return {
    title: meta?.title ?? "",
    studentLabel: meta?.studentLabel ?? "",
    method: snapshot.method,
    url: snapshot.url,
    status: snapshot.status == null ? "" : String(snapshot.status),
    statusText: snapshot.statusText,
    durationMs: snapshot.durationMs == null ? "" : String(snapshot.durationMs),
    requestHeadersText: Object.entries(snapshot.requestHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    responseHeadersText: Object.entries(snapshot.responseHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    requestBody: snapshot.requestBody,
    responseBody: snapshot.responseBody,
    note: snapshot.note,
    afterFeedback: false,
  };
}
