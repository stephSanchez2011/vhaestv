"use client";

import type { RequestFormValues } from "@/lib/form";

const METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
] as const;

type Props = {
  values: RequestFormValues;
  onChange: (values: RequestFormValues) => void;
  showMeta?: boolean;
  showAfterFeedback?: boolean;
  submitLabel: string;
  onSubmit: () => void;
  pending?: boolean;
  error?: string | null;
};

export function RequestForm({
  values,
  onChange,
  showMeta = false,
  showAfterFeedback = false,
  submitLabel,
  onSubmit,
  pending = false,
  error = null,
}: Props) {
  function update<K extends keyof RequestFormValues>(
    key: K,
    value: RequestFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {showMeta && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="label">Titre de l’exercice</span>
            <input
              className="field"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex. POST /login"
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Ton prénom / pseudo</span>
            <input
              className="field"
              value={values.studentLabel}
              onChange={(e) => update("studentLabel", e.target.value)}
              placeholder="Ex. Léa"
            />
          </label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[140px_1fr_120px]">
        <label className="block space-y-2">
          <span className="label">Méthode</span>
          <select
            className="field font-mono"
            value={values.method}
            onChange={(e) =>
              update("method", e.target.value as RequestFormValues["method"])
            }
          >
            {METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 sm:col-span-1">
          <span className="label">URL</span>
          <input
            className="field font-mono"
            value={values.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder="https://api.example.com/users"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="label">Status</span>
          <input
            className="field font-mono"
            value={values.status}
            onChange={(e) => update("status", e.target.value)}
            placeholder="200"
            inputMode="numeric"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="label">Status text</span>
          <input
            className="field"
            value={values.statusText}
            onChange={(e) => update("statusText", e.target.value)}
            placeholder="OK"
          />
        </label>
        <label className="block space-y-2">
          <span className="label">Durée (ms)</span>
          <input
            className="field font-mono"
            value={values.durationMs}
            onChange={(e) => update("durationMs", e.target.value)}
            placeholder="120"
            inputMode="numeric"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block space-y-2">
          <span className="label">Headers requête (une ligne = Header: valeur)</span>
          <textarea
            className="field min-h-36 font-mono text-sm"
            value={values.requestHeadersText}
            onChange={(e) => update("requestHeadersText", e.target.value)}
            placeholder={"Content-Type: application/json\nAuthorization: Bearer …"}
          />
        </label>
        <label className="block space-y-2">
          <span className="label">Headers réponse</span>
          <textarea
            className="field min-h-36 font-mono text-sm"
            value={values.responseHeadersText}
            onChange={(e) => update("responseHeadersText", e.target.value)}
            placeholder={"content-type: application/json"}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block space-y-2">
          <span className="label">Body requête</span>
          <textarea
            className="field min-h-40 font-mono text-sm"
            value={values.requestBody}
            onChange={(e) => update("requestBody", e.target.value)}
            placeholder='{"email":"lea@mail.com"}'
          />
        </label>
        <label className="block space-y-2">
          <span className="label">Body réponse</span>
          <textarea
            className="field min-h-40 font-mono text-sm"
            value={values.responseBody}
            onChange={(e) => update("responseBody", e.target.value)}
            placeholder='{"token":"…"}'
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="label">Note pour le formateur</span>
        <textarea
          className="field min-h-24"
          value={values.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="Ex. J’ai ajouté le Bearer comme demandé."
        />
      </label>

      {showAfterFeedback && (
        <label className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={values.afterFeedback}
            onChange={(e) => update("afterFeedback", e.target.checked)}
          />
          <span>
            <span className="block font-medium text-[var(--ink)]">
              Retravaillé après retex formateur
            </span>
            <span className="mt-1 block text-sm text-[var(--muted)]">
              Marque clairement cette version comme une correction suite au
              retour.
            </span>
          </span>
        </label>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Envoi…" : submitLabel}
      </button>
    </form>
  );
}
