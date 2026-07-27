"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { buildRenderLinkAbsolute } from "@/lib/magic-link";
import type { CohortDashboard, Exercise, Student } from "@/lib/v2-types";

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
  const [students, setStudents] = useState<Student[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentRef, setStudentRef] = useState("");
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [exerciseMethod, setExerciseMethod] = useState("POST");
  const [exercisePath, setExercisePath] = useState("/login");
  const [exerciseStatus, setExerciseStatus] = useState("200");

  const load = useCallback(async () => {
    if (!cohortId) return;
    const [dashRes, studentsRes, exercisesRes] = await Promise.all([
      fetch(`/api/v2/cohorts/${cohortId}/dashboard`),
      fetch(`/api/v2/cohorts/${cohortId}/students`),
      fetch(`/api/v2/cohorts/${cohortId}/exercises`),
    ]);
    const dashData = await dashRes.json();
    const studentsData = await studentsRes.json();
    const exercisesData = await exercisesRes.json();

    if (dashData.error) {
      setError(dashData.error);
      return;
    }
    setDashboard(dashData.dashboard);
    setStudents(studentsData.students || []);
    setExercises(exercisesData.exercises || []);
  }, [cohortId]);

  useEffect(() => {
    void load().catch(() => setError("Chargement impossible"));
  }, [load]);

  async function addStudent() {
    if (!cohortId || !studentName.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v2/cohorts/${cohortId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: studentName.trim(),
          externalRef: studentRef.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setStudentName("");
      setStudentRef("");
      await load();
    } catch {
      setError("Erreur réseau");
    } finally {
      setPending(false);
    }
  }

  async function addExercise() {
    if (!cohortId || !exerciseTitle.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v2/cohorts/${cohortId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: exerciseTitle.trim(),
          expected: {
            method: exerciseMethod,
            urlIncludes: exercisePath.trim(),
            requiredHeaders:
              exerciseMethod === "GET" ? ["Authorization"] : ["Content-Type"],
            expectedStatus: Number(exerciseStatus),
            requireAuthorization: exerciseMethod === "GET",
            requireJsonBody: exerciseMethod !== "GET",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setExerciseTitle("");
      await load();
    } catch {
      setError("Erreur réseau");
    } finally {
      setPending(false);
    }
  }

  function renderLink(studentId: string, exerciseId: string) {
    if (typeof window === "undefined") return "";
    return buildRenderLinkAbsolute(
      { cohortId, studentId, exerciseId },
      window.location.origin,
    );
  }

  if (error && !dashboard) {
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

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel space-y-4">
          <h2 className="section-title">Élèves</h2>
          <div className="space-y-2">
            <input
              className="field"
              placeholder="Nom affiché (ex. Léa)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <input
              className="field"
              placeholder="Réf. optionnelle (ex. lea)"
              value={studentRef}
              onChange={(e) => setStudentRef(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={pending || !studentName.trim()}
              onClick={addStudent}
            >
              Ajouter l'élève
            </button>
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Aucun élève.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((student) => (
                <li
                  key={student.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3"
                >
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="font-semibold hover:text-[var(--accent-ink)]"
                  >
                    {student.displayName}
                  </Link>
                  {student.externalRef && (
                    <p className="text-xs text-[var(--muted)]">{student.externalRef}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel space-y-4">
          <h2 className="section-title">Exercices</h2>
          <div className="space-y-2">
            <input
              className="field"
              placeholder="Titre (ex. POST /login)"
              value={exerciseTitle}
              onChange={(e) => setExerciseTitle(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                className="field"
                value={exerciseMethod}
                onChange={(e) => setExerciseMethod(e.target.value)}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
              <input
                className="field"
                placeholder="/login"
                value={exercisePath}
                onChange={(e) => setExercisePath(e.target.value)}
              />
              <input
                className="field"
                placeholder="Status attendu"
                value={exerciseStatus}
                onChange={(e) => setExerciseStatus(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={pending || !exerciseTitle.trim()}
              onClick={addExercise}
            >
              Ajouter l'exercice
            </button>
          </div>
          {exercises.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Aucun exercice.</p>
          ) : (
            <ul className="space-y-2">
              {exercises.map((exercise) => (
                <li
                  key={exercise.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3"
                >
                  <p className="font-semibold">{exercise.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {exercise.expected.method} {exercise.expected.urlIncludes} →{" "}
                    {exercise.expected.expectedStatus}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {students.length > 0 && exercises.length > 0 && (
        <section className="panel space-y-3">
          <h2 className="section-title">Liens de rendu (élève × exercice)</h2>
          <p className="text-sm text-[var(--muted)]">
            Envoie ce lien à l'élève : il crée son rendu et il apparaît
            automatiquement dans le tableau ci-dessous.
          </p>
          <div className="space-y-2">
            {students.map((student) =>
              exercises.map((exercise) => (
                <div
                  key={`${student.id}-${exercise.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm"
                >
                  <span className="font-medium">{student.displayName}</span>
                  <span className="text-[var(--muted)]">·</span>
                  <span>{exercise.title}</span>
                  <CopyButton
                    value={renderLink(student.id, exercise.id)}
                    label="Copier lien rendu"
                    className="ml-auto"
                  />
                </div>
              )),
            )}
          </div>
        </section>
      )}

      <section className="panel overflow-x-auto">
        <h2 className="section-title mb-3">Progression</h2>
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
                      {cell.shareId ? (
                        <Link
                          href={`/s/${cell.shareId}`}
                          className="font-mono text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]"
                        >
                          v{cell.currentVersion} · {Math.round(cell.scoreRatio * 100)}%
                        </Link>
                      ) : (
                        <CopyButton
                          value={renderLink(row.studentId, cell.exerciseId)}
                          label="Lien rendu"
                          className="!px-2 !py-1"
                        />
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
