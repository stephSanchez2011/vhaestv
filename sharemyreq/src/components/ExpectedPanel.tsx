"use client";

import { useState } from "react";
import { emptyExpected } from "@/lib/checklist";
import type { ExpectedCriteria, HttpMethod, PublicShare } from "@/lib/types";

const METHODS: Array<HttpMethod | ""> = [
  "",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
];

type Props = {
  shareId: string;
  expected: ExpectedCriteria;
  onUpdated: (share: PublicShare) => void;
};

export function ExpectedPanel({ shareId, expected, onUpdated }: Props) {
  const [draft, setDraft] = useState<ExpectedCriteria>(
    expected ?? emptyExpected(),
  );
  const [headersText, setHeadersText] = useState(
    (expected?.requiredHeaders || []).join("\n"),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const payload: ExpectedCriteria = {
        ...draft,
        requiredHeaders: headersText
          .split(/[\n,]/)
          .map((h) => h.trim())
          .filter(Boolean),
        expectedStatus:
          draft.expectedStatus == null || Number.isNaN(Number(draft.expectedStatus))
            ? null
            : Number(draft.expectedStatus),
      };
      const res = await fetch(`/api/shares/${shareId}/expected`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expected: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      onUpdated(data.share);
      setDraft(data.share.expected);
      setHeadersText((data.share.expected.requiredHeaders || []).join("\n"));
      setSaved(true);
    } catch {
      setError("Impossible d’enregistrer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel space-y-4">
      <div>
        <h2 className="section-title">Critères attendus</h2>
        <p className="section-sub">
          La checklist compare automatiquement reçu vs attendu.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="label">Méthode attendue</span>
          <select
            className="field font-mono"
            value={draft.method}
            onChange={(e) =>
              setDraft({
                ...draft,
                method: e.target.value as HttpMethod | "",
              })
            }
          >
            {METHODS.map((method) => (
              <option key={method || "any"} value={method}>
                {method || "Indifférent"}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="label">Status attendu</span>
          <input
            className="field font-mono"
            value={draft.expectedStatus ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                expectedStatus:
                  e.target.value.trim() === "" ? null : Number(e.target.value),
              })
            }
            placeholder="200"
            inputMode="numeric"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="label">L’URL doit contenir</span>
        <input
          className="field font-mono"
          value={draft.urlIncludes}
          onChange={(e) => setDraft({ ...draft, urlIncludes: e.target.value })}
          placeholder="/api/login"
        />
      </label>

      <label className="block space-y-2">
        <span className="label">Headers requis (un par ligne)</span>
        <textarea
          className="field min-h-24 font-mono text-sm"
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          placeholder={"Content-Type\nAccept"}
        />
      </label>

      <div className="space-y-2">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.requireAuthorization}
            onChange={(e) =>
              setDraft({ ...draft, requireAuthorization: e.target.checked })
            }
          />
          Authorization obligatoire
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.requireJsonBody}
            onChange={(e) =>
              setDraft({ ...draft, requireJsonBody: e.target.checked })
            }
          />
          Body JSON obligatoire
        </label>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && (
        <p className="text-sm text-[var(--ok)]">Critères enregistrés.</p>
      )}

      <button
        type="button"
        className="btn-secondary"
        disabled={pending}
        onClick={save}
      >
        {pending ? "Enregistrement…" : "Enregistrer les critères"}
      </button>
    </section>
  );
}
