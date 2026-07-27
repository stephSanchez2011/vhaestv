"use client";

import { useState } from "react";
import type { RequestFormValues } from "@/lib/form";
import { applyImportToForm, parseImport } from "@/lib/import";

type Props = {
  values: RequestFormValues;
  onChange: (values: RequestFormValues) => void;
};

const EXAMPLE_CURL = `curl 'https://api.example.com/login' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  --data-raw '{"email":"lea@mail.com","password":"secret"}'`;

export function ImportPaste({ values, onChange }: Props) {
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "fail" | null>(null);

  function runImport() {
    const result = parseImport(raw);
    if (!result.ok) {
      setTone("fail");
      setMessage(result.error);
      return;
    }

    onChange(applyImportToForm(values, result.snapshot));
    setTone("ok");
    setMessage(
      result.kind === "curl"
        ? "Curl importé — complète le status/réponse si besoin."
        : "HAR importé — requête + réponse préremplies.",
    );
  }

  return (
    <section className="rounded-2xl border border-dashed border-[var(--accent)] bg-[var(--accent-soft)]/40 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title text-[1.15rem]">Coller un curl ou un HAR</h2>
          <p className="section-sub">
            Depuis DevTools → Network → Copy as cURL / Save as HAR. Ça préremplit le formulaire.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setRaw(EXAMPLE_CURL);
            setMessage(null);
            setTone(null);
          }}
        >
          Exemple curl
        </button>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="label">Coller ici</span>
        <textarea
          className="field min-h-32 font-mono text-sm"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="curl 'https://…' -X POST -H 'Content-Type: application/json' ..."
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={runImport}>
          Importer dans le formulaire
        </button>
        {message && (
          <p
            className={`text-sm ${
              tone === "ok" ? "text-[var(--ok)]" : "text-[var(--fail)]"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
