"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CaptureSnippet } from "@/components/CaptureSnippet";
import { Checklist } from "@/components/Checklist";
import { ExpectedSummary } from "@/components/ExpectedSummary";
import { RequestForm } from "@/components/RequestForm";
import { ShareProgressBanner } from "@/components/ShareProgressBanner";
import { buildChecklist } from "@/lib/checklist";
import type { RequestFormValues } from "@/lib/form";
import { formFromSnapshot, snapshotFromForm } from "@/lib/form";
import type { PublicShare } from "@/lib/types";
import type { ShareProgressContext } from "@/lib/v2-types";

type CreatedInfo = {
  shareUrl: string;
  editUrl: string;
  editToken: string;
  trainerUrl?: string;
  trainerToken?: string;
  linked?: boolean;
  dashboardUrl?: string | null;
};

export function EditShareClient({
  shareId,
  initialShare,
}: {
  shareId: string;
  initialShare: PublicShare;
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const created = searchParams.get("created") === "1";

  const [share, setShare] = useState(initialShare);
  const [trainerUrl, setTrainerUrl] = useState("");
  const [values, setValues] = useState<RequestFormValues>(() => {
    const latest = initialShare.versions[initialShare.versions.length - 1];
    return formFromSnapshot(latest.snapshot, {
      title: initialShare.title,
      studentLabel: initialShare.studentLabel,
    });
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<CreatedInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [progress, setProgress] = useState<ShareProgressContext | null>(null);

  useEffect(() => {
    void fetch(`/api/v2/shares/${shareId}/progress`)
      .then((r) => r.json())
      .then((d) => {
        if (d.linked && d.context) setProgress(d.context);
      })
      .catch(() => undefined);
  }, [shareId]);

  useEffect(() => {
    if (!created) return;
    const raw = sessionStorage.getItem(`sharemyreq:created:${shareId}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CreatedInfo;
      setCreatedInfo(parsed);
      if (parsed.trainerUrl) setTrainerUrl(parsed.trainerUrl);
    } catch {
      // ignore
    }
  }, [created, shareId]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/shares/${shareId}?editToken=${encodeURIComponent(token)}`,
        );
        const data = await res.json();
        if (!res.ok) return;
        setShare(data.share);
        if (data.trainerUrl) {
          const absolute =
            typeof window !== "undefined"
              ? `${window.location.origin}${data.trainerUrl}`
              : data.trainerUrl;
          setTrainerUrl(absolute);
        }
      } catch {
        // ignore
      }
    })();
  }, [shareId, token]);

  const latestFeedback = useMemo(
    () => [...share.feedback].reverse()[0],
    [share.feedback],
  );

  const liveChecklist = useMemo(
    () => buildChecklist(snapshotFromForm(values), share.expected),
    [values, share.expected],
  );

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${shareId}`
      : `/s/${shareId}`;
  const editUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/e/${shareId}?token=${token}`
      : `/e/${shareId}?token=${token}`;

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  async function submit() {
    if (!token) {
      setError("Token d’édition manquant.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/shares/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editToken: token,
          snapshot: snapshotFromForm(values),
          afterFeedback: values.afterFeedback || share.feedback.length > 0,
          note: values.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Mise à jour impossible");
        return;
      }
      setShare(data.share);
      const latest = data.share.versions[data.share.versions.length - 1];
      setValues(
        formFromSnapshot(latest.snapshot, {
          title: data.share.title,
          studentLabel: data.share.studentLabel,
        }),
      );
    } catch {
      setError("Erreur réseau.");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="panel mt-6">
        <h1 className="section-title">Lien d’édition invalide</h1>
        <p className="mt-2 text-[var(--muted)]">
          Le token est manquant. Utilise le lien perso reçu à la création.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pt-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
          Espace apprenant
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-brand)] text-4xl tracking-tight">
          {share.title}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          {progress ? (
            <>
              <Link
                href={progress.studentUrl}
                className="font-medium text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-2"
              >
                {progress.student.displayName}
              </Link>
              {" · "}
              {progress.exercise.title}
              {" · "}
            </>
          ) : (
            <>{share.studentLabel} · </>
          )}
          Version courante : v{share.versions.length}. Même lien formateur,
          nouvel historique à chaque mise à jour.
        </p>
      </div>

      {progress && <ShareProgressBanner context={progress} />}

      <section className="panel space-y-3">
        <h2 className="section-title">Tes liens</h2>
        <div className="grid gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3">
            <p className="text-sm font-semibold">Lien lecture (public)</p>
            <p className="mt-1 break-all font-mono text-sm">{shareUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => copy("share", shareUrl)}
              >
                {copied === "share" ? "Copié" : "Copier"}
              </button>
              <Link href={`/s/${shareId}`} className="btn-secondary">
                Ouvrir
              </Link>
            </div>
          </div>
          {trainerUrl && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3">
              <p className="text-sm font-semibold">
                Lien formateur (retex + critères)
              </p>
              <p className="mt-1 break-all font-mono text-sm">{trainerUrl}</p>
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={() => copy("trainer", trainerUrl)}
              >
                {copied === "trainer" ? "Copié" : "Copier"}
              </button>
            </div>
          )}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3">
            <p className="text-sm font-semibold">Ton lien d’édition (privé)</p>
            <p className="mt-1 break-all font-mono text-sm">{editUrl}</p>
            <button
              type="button"
              className="btn-secondary mt-3"
              onClick={() => copy("edit", editUrl)}
            >
              {copied === "edit" ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
        {createdInfo && (
          <div className="space-y-2 text-sm text-[var(--accent-ink)]">
            <p>
              Partage créé. Envoie le lien formateur, garde ton lien d'édition.
            </p>
            {createdInfo.linked && createdInfo.dashboardUrl && (
              <p>
                Rendu lié à la promo — visible dans le{" "}
                <Link href={createdInfo.dashboardUrl} className="underline">
                  dashboard formateur
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </section>

      <CaptureSnippet shareId={shareId} editToken={token} />
      <ExpectedSummary expected={share.expected} />

      {latestFeedback && (
        <section className="panel border-[var(--accent)]">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
            Dernier retex
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {latestFeedback.authorLabel} · sur v{latestFeedback.targetVersion} ·{" "}
            {new Date(latestFeedback.createdAt).toLocaleString("fr-FR")}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed">
            {latestFeedback.message}
          </p>
        </section>
      )}

      <Checklist items={liveChecklist} />

      <section className="panel">
        <h2 className="section-title mb-4">Mettre à jour la requête</h2>
        <RequestForm
          values={values}
          onChange={setValues}
          showAfterFeedback={share.feedback.length > 0}
          submitLabel="Publier une nouvelle version"
          onSubmit={submit}
          pending={pending}
          error={error}
        />
      </section>
    </div>
  );
}
