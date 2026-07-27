"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { StudentProgress } from "@/lib/v2-types";

export default function StudentProgressPage() {
  const params = useParams<{ id: string }>();
  const studentId = params.id;
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    void fetch(`/api/v2/students/${studentId}/progress`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setProgress(d.progress);
      })
      .catch(() => setError("Chargement impossible"));
  }, [studentId]);

  if (error) {
    return (
      <div className="panel mt-8">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!progress) {
    return <p className="pt-8 text-[var(--muted)]">Chargement…</p>;
  }

  return (
    <div className="space-y-6 pt-6">
      <header className="panel">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
          Fiche élève
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-brand)] text-3xl tracking-tight">
          {progress.student.displayName}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{progress.cohort.name}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="badge-info">
            {progress.stats.validatedCount}/{progress.stats.totalSubmissions} validés
          </span>
          <span className="badge-ok">
            score moyen {Math.round(progress.stats.avgScoreRatio * 100)}%
          </span>
          <span className="badge-warn">
            rework {progress.stats.reworkRate}%
          </span>
        </div>
      </header>

      <section className="panel space-y-4">
        <h2 className="section-title">Rendus</h2>
        {progress.submissions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucun rendu lié.</p>
        ) : (
          progress.submissions.map((item) => (
            <div
              key={item.submission.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.exercise.title}</p>
                <span
                  className={
                    item.submission.isValidated ? "badge-ok" : "badge-warn"
                  }
                >
                  {item.submission.isValidated ? "Validé" : "En cours"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {item.versions.length} version(s) · dernier score{" "}
                {Math.round(item.latestScoreRatio * 100)}%
              </p>
              <Link
                href={`/s/${item.shareId}`}
                className="btn-secondary mt-3 inline-flex"
              >
                Ouvrir le rendu
              </Link>
              <ol className="mt-3 space-y-1 text-sm font-mono text-[var(--muted)]">
                {item.versions.map((v) => (
                  <li key={v.id}>
                    v{v.shareVersion} · {Math.round(v.scoreRatio * 100)}% · ok=
                    {v.scoreOk} fail={v.scoreFail}
                    {v.reworkedAfterFeedback ? " · retex" : ""}
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </section>

      <Link
        href={`/dashboard/${progress.cohort.id}`}
        className="btn-secondary inline-flex"
      >
        ← Retour promo
      </Link>
    </div>
  );
}
