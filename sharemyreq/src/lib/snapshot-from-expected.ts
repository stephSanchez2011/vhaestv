import type { ExpectedCriteria, HttpMethod, RequestSnapshot } from "./types";

const METHODS = new Set<HttpMethod>([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

function asHttpMethod(value: string): HttpMethod {
  const upper = value.toUpperCase();
  return METHODS.has(upper as HttpMethod) ? (upper as HttpMethod) : "GET";
}

export function snapshotFromExpected(
  expected: ExpectedCriteria,
  _title?: string,
): RequestSnapshot {
  const method = asHttpMethod(expected.method || "GET");
  const path = expected.urlIncludes?.trim() || "/api";
  const urlPath = path.startsWith("/") ? path : `/${path}`;
  const expectedStatus = expected.expectedStatus ?? 200;
  const wrongStatus =
    expectedStatus === 201 ? 400 : expectedStatus === 200 ? 401 : 400;

  const hasBody =
    method === "POST" || method === "PUT" || method === "PATCH";

  return {
    method,
    url: `https://api.example.com${urlPath}`,
    status: wrongStatus,
    statusText: wrongStatus === 401 ? "Unauthorized" : "Bad Request",
    durationMs: 80,
    requestHeaders: hasBody
      ? { "Content-Type": "application/json", Accept: "application/json" }
      : { Accept: "application/json" },
    responseHeaders: { "content-type": "application/json" },
    requestBody: hasBody ? '{\n  "email": "eleve@mail.com"\n}' : "",
    responseBody: '{\n  "error": "à corriger"\n}',
    note: "",
  };
}
