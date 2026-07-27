"use client";

import { useMemo, useState } from "react";

type Props = {
  shareId: string;
  editToken: string;
};

export function CaptureSnippet({ shareId, editToken }: Props) {
  const [copied, setCopied] = useState<"snippet" | "inbox" | null>(null);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://YOUR_HOST";

  const inboxUrl = `${origin}/api/shares/${shareId}/inbox?token=${editToken}`;
  const captureEndpoint = `${origin}/api/shares/${shareId}/capture`;

  const snippet = useMemo(
    () => `(() => {
  const SHARE_ID = ${JSON.stringify(shareId)};
  const EDIT_TOKEN = ${JSON.stringify(editToken)};
  const CAPTURE_URL = ${JSON.stringify(captureEndpoint)};
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const started = performance.now();
    const response = await originalFetch(input, init);
    try {
      const clone = response.clone();
      const url = typeof input === "string" ? input : input.url;
      const method = (init.method || "GET").toUpperCase();
      const requestHeaders = {};
      if (init.headers) {
        const h = new Headers(init.headers);
        h.forEach((value, key) => { requestHeaders[key] = value; });
      }
      const responseHeaders = {};
      clone.headers.forEach((value, key) => { responseHeaders[key] = value; });
      const requestBody = typeof init.body === "string" ? init.body : "";
      const responseBody = await clone.text();
      await originalFetch(CAPTURE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editToken: EDIT_TOKEN,
          snapshot: {
            method,
            url,
            status: clone.status,
            statusText: clone.statusText,
            durationMs: Math.round(performance.now() - started),
            requestHeaders,
            responseHeaders,
            requestBody,
            responseBody,
            note: "Capturé via snippet fetch"
          }
        })
      });
      console.info("[ShareMyReq] capturé", method, url, "→ share", SHARE_ID);
    } catch (err) {
      console.warn("[ShareMyReq] capture échouée", err);
    }
    return response;
  };
  console.info("[ShareMyReq] fetch wrappé — les requêtes partent aussi vers ton partage");
})();`,
    [shareId, editToken, captureEndpoint],
  );

  async function copy(kind: "snippet" | "inbox", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="panel space-y-4">
      <div>
        <h2 className="section-title">Capture auto</h2>
        <p className="section-sub">
          Deux options : wrapper `fetch` dans la console, ou pointer ton front
          vers l’inbox mock (utile avant d’avoir un vrai backend).
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3">
        <p className="text-sm font-semibold">1. Snippet fetch (DevTools console)</p>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[var(--code-bg)] p-3 font-mono text-xs text-[var(--code-ink)]">
          {snippet}
        </pre>
        <button
          type="button"
          className="btn-secondary mt-3"
          onClick={() => copy("snippet", snippet)}
        >
          {copied === "snippet" ? "Copié" : "Copier le snippet"}
        </button>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3">
        <p className="text-sm font-semibold">2. Inbox mock (URL de secours)</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Remplace temporairement ton URL API par celle-ci. Chaque appel crée
          une nouvelle version sur ce partage.
        </p>
        <p className="mt-2 break-all font-mono text-sm">{inboxUrl}</p>
        <button
          type="button"
          className="btn-secondary mt-3"
          onClick={() => copy("inbox", inboxUrl)}
        >
          {copied === "inbox" ? "Copié" : "Copier l’URL inbox"}
        </button>
      </div>
    </section>
  );
}
