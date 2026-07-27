"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RequestForm } from "@/components/RequestForm";
import type { RequestFormValues } from "@/lib/form";
import { formFromSnapshot, snapshotFromForm } from "@/lib/form";
import { EXERCISE_TEMPLATES } from "@/lib/templates";

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

export default function NewSharePage() {
  const router = useRouter();
  const [values, setValues] = useState(blankValues);
  const [selectedTemplate, setSelectedTemplate] = useState("login-post");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(
    () => EXERCISE_TEMPLATES.find((item) => item.id === selectedTemplate),
    [selectedTemplate],
  );

  function applyTemplate(id: string) {
    setSelectedTemplate(id);
    const next = EXERCISE_TEMPLATES.find((item) => item.id === id);
    if (!next) return;
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
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          studentLabel: values.studentLabel,
          snapshot: snapshotFromForm(values),
          expected: template?.expected,
        }),
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
        }),
      );
      router.push(`/e/${data.id}?token=${data.editToken}&created=1`);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pt-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
          Apprenant
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-brand)] text-4xl tracking-tight">
          Créer un partage de requête
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Choisis un template d’exercice ou colle un curl/HAR. Tu obtiendras un
          lien lecture, un lien formateur, et ton lien d’édition.
        </p>
      </div>

      <section className="panel">
        <h2 className="section-title mb-3">Templates d’exercice</h2>
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

      <div className="panel">
        <RequestForm
          values={values}
          onChange={setValues}
          showMeta
          submitLabel="Créer le lien de partage"
          onSubmit={submit}
          pending={pending}
          error={error}
        />
      </div>
    </div>
  );
}
