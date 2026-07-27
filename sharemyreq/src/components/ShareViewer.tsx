"use client";

import { useMemo, useState } from "react";
import { Checklist } from "@/components/Checklist";
import { DiffView } from "@/components/DiffView";
import { ExpectedPanel } from "@/components/ExpectedPanel";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { RequestView } from "@/components/RequestView";
import { VersionTimeline } from "@/components/VersionTimeline";
import { buildChecklist, checklistScore, diffVersions } from "@/lib/checklist";
import type { PublicShare } from "@/lib/types";

export function ShareViewer({ initialShare }: { initialShare: PublicShare }) {
  const [share, setShare] = useState(initialShare);
  const [selectedVersion, setSelectedVersion] = useState(
    initialShare.versions[initialShare.versions.length - 1]?.version ?? 1,
  );

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

  return (
    <div className="space-y-6 pt-4">
      <header className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
              Vue formateur
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-brand)] text-3xl tracking-tight">
              {share.title}
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              {share.studentLabel} · {share.versions.length} version
              {share.versions.length > 1 ? "s" : ""} · expire le{" "}
              {new Date(share.expiresAt).toLocaleString("fr-FR")}
            </p>
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
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <VersionTimeline
            versions={share.versions}
            selectedVersion={selectedVersion}
            onSelect={setSelectedVersion}
          />
          <ExpectedPanel
            shareId={share.id}
            expected={share.expected}
            onUpdated={setShare}
          />
          <FeedbackPanel
            shareId={share.id}
            feedback={share.feedback}
            onUpdated={(next) => {
              setShare(next);
              setSelectedVersion(
                next.versions[next.versions.length - 1]?.version ?? 1,
              );
            }}
          />
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
