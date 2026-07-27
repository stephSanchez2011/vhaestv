"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequestForm } from "@/components/RequestForm";
import type { RequestFormValues } from "@/lib/form";
import { snapshotFromForm } from "@/lib/form";

const initialValues: RequestFormValues = {
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
  const [values, setValues] = useState(initialValues);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Remplis ce que ton front envoie vraiment. Tu obtiendras un lien
          formateur (lecture) et un lien perso pour mettre à jour après retex.
        </p>
      </div>

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
