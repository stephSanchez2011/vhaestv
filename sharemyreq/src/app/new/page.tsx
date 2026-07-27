"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RequestForm } from "@/components/RequestForm";
import type { RequestFormValues } from "@/lib/form";
import { formFromSnapshot, snapshotFromForm } from "@/lib/form";
import { snapshotFromExpected } from "@/lib/snapshot-from-expected";
import { EXERCISE_TEMPLATES } from "@/lib/templates";
import type { ExpectedCriteria } from "@/lib/types";
import type { RenderContext } from "@/lib/v2-types";

const blankValues: RequestFormValues = {
  title: "POST /login",
  studentLabel: "",
  method: "POST",
  url: "https://api.example.com/login",
  status: "401",
  statusText: "Unauthorized",
  durationMs: "85",
  requestHeadersText:
    "Content-Type: application/json\nAccept: application/json",
  responseHeadersText: "content-type: application/json",
  requestBody: '{\n  "email": "lea@mail.com",\n  "password": "secret"\n}',
  responseBody: '{\n  "error": "missing authorization"\n}',
  note: "",
  afterFeedback: false,
};

function NewShareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cohortId = searchParams.get("cohort")?.trim() || "";
  const studentId = searchParams.get("student")?.trim() || "";
  const exerciseId = searchParams.get("exercise")?.trim() || "";
  const isMagicLink = Boolean(cohortId && studentId && exerciseId);

  const [values, setValues] = useState(blankValues);
  const [selectedTemplate, setSelectedTemplate] = useState("login-post");
  const [expected, setExpected] = useState<ExpectedCriteria | undefined>(
    undefined,
  );
  const [renderContext, setRenderContext] = useState<RenderContext | null>(
    null,
  );
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(isMagicLink);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(
    () => EXERCISE_TEMPLATES.find((item) => item.id === selectedTemplate),
    [selectedTemplate],
  );

  useEffect(() => {
    if (!isMagicLink) return;

    setContextLoading(true);
    const q = new URLSearchParams({ cohort: cohortId, student: studentId, exercise: exerciseId });
    void fetch(`/api/v2/render-context?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setContextError(d.error);
          return;
        }
        const ctx = d.context as RenderContext;
        setRenderContext(ctx);
        setExpected(ctx.exercise.expected);
        setValues(
          formFromSnapshot(
            snapshotFromExpected(ctx.exercise.expected, ctx.exercise.title),
            {
              title: ctx.exercise.title,
              studentLabel: ctx.student.displayName,
            },
          ),
        );
      })
      .catch(() => setContextError("Contexte de rendu introuvable."))
      .finally(() => setContextLoading(false));
  }, [cohortId, exerciseId, isMagicLink, studentId]);

  function applyTemplate(id: string) {
    setSelectedTemplate(id);
    const next = EXERCISE_TEMPLATES.find((item) => item.id === id);
    if (!next) return;
    setExpected(next.expected);
    setValues(
      formFromSnapshot(next.snapshot, {
        title: next.title,
        studentLabel: values.studentLabel,
      }),
    );
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: values.title,
        studentLabel: values.studentLabel,
        snapshot: snapshotFromForm(values),
        expected: isMagicLink ? expected : template?.expected,
      };
      if (isMagicLink) {
        payload.cohortId = cohortId;
        payload.studentId = studentId;
        payload.exerciseId = exerciseId;
      }

      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Création impossible");
        return;
      }

      sessionStorage.setItem(
        `sharemyreq:created:${data.id}`,
        JSON.stringify({
          shareUrl: data.shareUrl,
          editUrl: data.editUrl,
          editToken: data.editToken,
          trainerUrl: data.trainerUrl,
          trainerToken: data.trainerToken,
          linked: data.linked,
          dashboardUrl: data.dashboardUrl,
        }),
      );
      router.push(`/e/${data.id}?token=${data.editToken}&created=1`);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setPending(false);
    }
  }

  if (contextLoading) {
    return <p className="pt-8 text-[var(--muted)]">Chargement de l'exercice…</p>;
  }

  if (contextError) {
    return (
      <div className="panel mt-8">
        <p className="text-red-700">{contextError}</p>
        <Link href="/new" className="btn-secondary mt-4 inline-flex">
          Créer un partage libre
        </Link>
      </div>
    );
  }

  if (renderContext?.existingSubmission) {
    const existing = renderContext.existingSubmission;
    return (
      <div className="mx-auto max-w-4xl space-y-6 pt-6">
        <div className="panel">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
            Rendu déjà existant
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-brand)] text-3xl tracking-tight">
            {renderContext.exercise.title}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            {renderContext.student.displayName} · {renderContext.cohort.name}
          </p>
          <p className="mt-4 text-sm">
            Tu as déjà un rendu pour cet exercice. Continue dessus pour ajouter
            une nouvelle version après retex.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={existing.editLink} className="btn-primary">
              Continuer mon rendu
            </Link>
            <Link href={existing.shareLink} className="btn-secondary">
              Voir le partage
            </Link>
            <Link
              href={`/dashboard/${renderContext.cohort.id}`}
              className="btn-secondary"
            >
              Dashboard promo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pt-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
          {isMagicLink ? "Rendu exercice" : "Apprenant"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-brand)] text-4xl tracking-tight">
          {isMagicLink
            ? renderContext?.exercise.title || "Créer un rendu"
            : "Créer un partage de requête"}
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          {isMagicLink && renderContext ? (
            <>
              Promo <strong>{renderContext.cohort.name}</strong> · élève{" "}
              <strong>{renderContext.student.displayName}</strong>. Ton rendu
              sera automatiquement suivi dans le dashboard formateur.
            </>
          ) : (
            <>
              Choisis un template d'exercice ou colle un curl/HAR. Tu obtiendras
              un lien lecture, un lien formateur, et ton lien d'édition.
            </>
          )}
        </p>
      </div>

      {!isMagicLink && (
        <section className="panel">
          <h2 className="section-title mb-3">Templates d'exercice</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {EXERCISE_TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyTemplate(item.id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  selectedTemplate === item.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)]"
                }`}
              >
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="panel">
        <RequestForm
          values={values}
          onChange={setValues}
          showMeta
          submitLabel={
            isMagicLink ? "Envoyer mon rendu" : "Créer le lien de partage"
          }
          onSubmit={submit}
          pending={pending}
          error={error}
        />
      </div>
    </div>
  );
}

export default function NewSharePage() {
  return (
    <Suspense fallback={<p className="pt-8 text-[var(--muted)]">Chargement…</p>}>
      <NewShareContent />
    </Suspense>
  );
}
