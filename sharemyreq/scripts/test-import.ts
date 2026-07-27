import assert from "node:assert/strict";
import { parseCurl, parseHar, parseImport } from "../src/lib/import";

const curl = parseCurl(`curl 'https://api.example.com/login' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer secret-token' \\
  --data-raw '{"email":"lea@mail.com"}'`);

assert.equal(curl.ok, true);
if (curl.ok) {
  assert.equal(curl.snapshot.method, "POST");
  assert.equal(curl.snapshot.url, "https://api.example.com/login");
  assert.equal(curl.snapshot.requestHeaders["Content-Type"], "application/json");
  assert.equal(
    curl.snapshot.requestHeaders.Authorization,
    "Bearer secret-token",
  );
  assert.match(curl.snapshot.requestBody, /lea@mail.com/);
}

const har = parseHar(
  JSON.stringify({
    log: {
      entries: [
        {
          time: 123.4,
          request: {
            method: "GET",
            url: "https://api.example.com/me",
            headers: [{ name: "Accept", value: "application/json" }],
          },
          response: {
            status: 200,
            statusText: "OK",
            headers: [{ name: "content-type", value: "application/json" }],
            content: { text: '{"id":1}' },
          },
        },
      ],
    },
  }),
);

assert.equal(har.ok, true);
if (har.ok) {
  assert.equal(har.snapshot.status, 200);
  assert.equal(har.snapshot.durationMs, 123);
  assert.ok(
    har.snapshot.responseBody.includes('"id": 1') ||
      har.snapshot.responseBody.includes('"id":1'),
  );
}

const bad = parseImport("hello world");
assert.equal(bad.ok, false);

console.log("import tests ok");
