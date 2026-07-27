"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CohortDashboard } from "@/lib/v2-types";

const statusBadge: Record<string, string> = {
  ok: "badge-ok",
  ko: "badge-fail",
  in_progress: "badge-warn",
  missing: "badge-info",
};

const statusLabel: Record<string, string> = {
  ok: "OK",
  ko: "Bloqué",
  in_progress: "En cours",
  missing: "—",
};

export default function CohortDashboardPage() {
  const params = useParams<{ id: string }>();
  const cohortId = params.id;
  const [dashboard, setDashboard] = useState<CohortDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cohortId) return;
    void fetch(`/api/v2/cohorts/${cohortId}/dashboard`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setDashboard(d.dashboard);
      })
      .catch(() => setError("Chargement impossible"));
  }, [cohortId]);

  if (error) {
    return (
      <div className="panel mt-8">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!dashboard) {
    return <p className="pt-8 text-[var(--muted)]">Chargement…</p>;
  }

  return (
    <div className="space-y-6 pt-6">
      <header className="panel">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
          Vue promo
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-brand)] text-3xl tracking-tight">
          {dashboard.cohort.name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="badge-info">{dashboard.stats.studentCount} élèves</span>
          <span className="badge-info">{dashboard.stats.exerciseCount} exercices</span>
          <span className="badge-ok">
            {dashboard.stats.validationRate}% validés
          </span>
          <span className="badge-fail">{dashboard.stats.blockedCount} bloqués</span>
        </div>
      </header>

      <section className="panel overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left">
              <th className="px-3 py-2">Élève</th>
              {dashboard.exercises.map((ex) => (
                <th key={ex.id} className="px-3 py-2">
                  {ex.title}
                </th>
              ))}
              <th className="px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.students.map((row) => (
              <tr key={row.studentId} className="border-b border-[var(--line)]">
                <td className="px-3 py-3">
                  <Link
                    href={`/dashboard/students/${row.studentId}`}
                    className="font-medium hover:text-[var(--accent-ink)]"
                  >
                    {row.displayName}
                  </Link>
                </td>
                {row.cells.map((cell) => (
                  <td key={cell.exerciseId} className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={statusBadge[cell.status]}>
                        {statusLabel[cell.status]}
                      </span>
                      {cell.shareId && (
                        <Link
                          href={`/s/${cell.shareId}`}
                          className="font-mono text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]"
                        >
                          v{cell.currentVersion} · {Math.round(cell.scoreRatio * 100)}%
                        </Link>
                      )}
                    </div>
                  </td>
                ))}
                <td className="px-3 py-3 font-mono">
                  {Math.round(row.overallScore * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Link href="/dashboard" className="btn-secondary inline-flex">
        ← Retour promos
      </Link>
    </div>
  );
}
