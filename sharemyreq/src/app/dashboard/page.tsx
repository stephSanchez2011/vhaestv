"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Cohort } from "@/lib/v2-types";

export default function DashboardHomePage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("Promo JS React 2026");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/v2/cohorts")
      .then((r) => r.json())
      .then((d) => setCohorts(d.cohorts || []))
      .catch(() => setError("Chargement impossible"));
  }, []);

  async function createCohort() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      window.location.href = data.dashboardUrl;
    } catch {
      setError("Erreur réseau");
    } finally {
      setPending(false);
    }
  }

  async function seedDemo() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/demo/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      window.location.href = data.dashboardUrl;
    } catch {
      setError("Erreur réseau");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
          Dashboard école
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-brand)] text-4xl tracking-tight">
          Promos & progression
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Vue agrégée par promo : qui progresse, qui est bloqué, sur quels exercices.
        </p>
      </div>

      <section className="panel space-y-4">
        <h2 className="section-title">Créer une promo</h2>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la promo"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={pending || !name.trim()}
            onClick={createCohort}
          >
            {pending ? "Création…" : "Créer"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={pending}
            onClick={seedDemo}
          >
            Charger une démo promo
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title mb-3">Promos existantes</h2>
        {cohorts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucune promo pour l'instant.</p>
        ) : (
          <ul className="space-y-2">
            {cohorts.map((cohort) => (
              <li key={cohort.id}>
                <Link
                  href={`/dashboard/${cohort.id}`}
                  className="block rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 hover:border-[var(--accent)]"
                >
                  <p className="font-semibold">{cohort.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {cohort.code || cohort.id}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
