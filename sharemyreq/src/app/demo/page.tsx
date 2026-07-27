"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      router.push(data.shareUrl);
    } catch {
      setError("Impossible de lancer la démo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
          Démo LinkedIn / formateurs
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-brand)] text-4xl tracking-tight">
          Voir ShareMyReq en 10 secondes
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Crée un partage réaliste : v1 en erreur → retex formateur → v2
          corrigée, avec critères attendus, checklist et diff.
        </p>
      </div>

      <section className="panel space-y-4">
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>1. Élève envoie POST /login sans Authorization (401)</li>
          <li>2. Formateur laisse un retex</li>
          <li>3. Élève republie sur le même lien (200 + Bearer)</li>
        </ul>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="button"
          className="btn-primary"
          disabled={pending}
          onClick={launch}
        >
          {pending ? "Création…" : "Lancer la démo formateur"}
        </button>
      </section>
    </div>
  );
}
