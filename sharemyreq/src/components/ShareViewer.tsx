"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Checklist } from "@/components/Checklist";
import { DiffView } from "@/components/DiffView";
import { ExpectedPanel } from "@/components/ExpectedPanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { RequestView } from "@/components/RequestView";
import { ShareProgressBanner } from "@/components/ShareProgressBanner";
import { VersionTimeline } from "@/components/VersionTimeline";
import { buildChecklist, checklistScore, diffVersions } from "@/lib/checklist";
import type { PublicShare } from "@/lib/types";
import type { ShareProgressContext } from "@/lib/v2-types";

function storageKey(shareId: string) {
  return `sharemyreq:trainer:${shareId}`;
}

export function ShareViewer({
  initialShare,
  initialTrainerToken = "",
}: {
  initialShare: PublicShare;
  initialTrainerToken?: string;
}) {
  const [share, setShare] = useState(initialShare);
  const [selectedVersion, setSelectedVersion] = useState(
    initialShare.versions[initialShare.versions.length - 1]?.version ?? 1,
  );
  const [trainerToken, setTrainerToken] = useState(initialTrainerToken);
  const [tokenInput, setTokenInput] = useState(initialTrainerToken);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [progress, setProgress] = useState<ShareProgressContext | null>(null);

  useEffect(() => {
    void fetch(`/api/v2/shares/${share.id}/progress`)
      .then((r) => r.json())
      .then((d) => {
        if (d.linked && d.context) setProgress(d.context);
      })
      .catch(() => undefined);
  }, [share.id]);

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey(share.id));
    const candidate = initialTrainerToken || saved || "";
    if (!candidate) return;
    setTrainerToken(candidate);
    setTokenInput(candidate);
    void unlock(candidate, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.id, initialTrainerToken]);

  async function unlock(token = tokenInput, persist = true) {
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch(`/api/shares/${share.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUnlocked(false);
        setUnlockError(data.error || "Token invalide");
        return;
      }
      setTrainerToken(token);
      setUnlocked(true);
      if (persist) sessionStorage.setItem(storageKey(share.id), token);
    } catch {
      setUnlockError("Impossible de vérifier le token.");
      setUnlocked(false);
    } finally {
      setUnlocking(false);
    }
  }

  const current = useMemo(
    () => share.versions.find((v) => v.version === selectedVersion),
    [share.versions, selectedVersion],
  );

  const previous = useMemo(() => {
    if (!current) return undefined;
    return share.versions.find((v) => v.version === current.version - 1);
  }, [share.versions, current]);

  if (!current) {
    return <p>Version introuvable.</p>;
  }

  const checklist = buildChecklist(current.snapshot, share.expected);
  const score = checklistScore(checklist);
  const changes = diffVersions(previous, current);
  const displayName = progress?.student.displayName || share.studentLabel;

  return (
    <div className="space-y-6 pt-4">
      <header className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
              Vue formateur {unlocked ? "· mode édition" : "· lecture seule"}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-brand)] text-3xl tracking-tight">
              {share.title}
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              {progress ? (
                <Link
                  href={progress.studentUrl}
                  className="font-medium text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-2 hover:text-[var(--accent-ink)]"
                >
                  {displayName}
                </Link>
              ) : (
                displayName
              )}{" "}
              · {share.versions.length} version
              {share.versions.length > 1 ? "s" : ""} · expire le{" "}
              {new Date(share.expiresAt).toLocaleString("fr-FR")}
            </p>
            {progress && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {progress.exercise.title} ·{" "}
                <Link
                  href={progress.cohortUrl}
                  className="underline underline-offset-2"
                >
                  {progress.cohort.name}
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={
                score.tone === "ok"
                  ? "badge-ok"
                  : score.tone === "warn"
                    ? "badge-warn"
                    : "badge-fail"
              }
            >
              {score.fail} à corriger · {score.warn} attention · {score.ok} ok
            </span>
            {current.afterFeedback && (
              <span className="badge-rework">Retravaillé après retex</span>
            )}
            {progress?.submission.isValidated && (
              <span className="badge-ok">Validé promo</span>
            )}
          </div>
        </div>
      </header>

      {progress && <ShareProgressBanner context={progress} />}

      {!unlocked && (
        <section className="panel space-y-3">
          <h2 className="section-title">Déverrouiller le mode formateur</h2>
          <p className="section-sub">
            Sans token, cette page est en lecture seule. Utilise le lien
            formateur fourni par l'apprenant (`?t=...`).
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className="field max-w-md font-mono"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Token formateur"
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={unlocking || !tokenInput.trim()}
              onClick={() => unlock()}
            >
              {unlocking ? "Vérification…" : "Déverrouiller"}
            </button>
          </div>
          {unlockError && <p className="text-sm text-red-700">{unlockError}</p>}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <VersionTimeline
            versions={share.versions}
            selectedVersion={selectedVersion}
            onSelect={setSelectedVersion}
          />
          {unlocked ? (
            <>
              <ExpectedPanel
                shareId={share.id}
                expected={share.expected}
                trainerToken={trainerToken}
                onUpdated={setShare}
              />
              <FeedbackPanel
                shareId={share.id}
                feedback={share.feedback}
                trainerToken={trainerToken}
                onUpdated={(next) => {
                  setShare(next);
                  setSelectedVersion(
                    next.versions[next.versions.length - 1]?.version ?? 1,
                  );
                }}
              />
            </>
          ) : (
            <section className="panel">
              <h2 className="section-title">Retex</h2>
              {share.feedback.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Aucun retour pour l’instant.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {[...share.feedback].reverse().map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3"
                    >
                      <p className="text-sm text-[var(--muted)]">
                        {item.authorLabel} · v{item.targetVersion}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap">{item.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
        <div className="space-y-6">
          <Checklist items={checklist} />
          <DiffView changes={changes} />
          <RequestView snapshot={current.snapshot} />
        </div>
      </div>
    </div>
  );
}
