"use client";

import Link from "next/link";
import type { ShareProgressContext } from "@/lib/v2-types";

export function ShareProgressBanner({
  context,
}: {
  context: ShareProgressContext;
}) {
  return (
    <section className="panel border-[var(--accent)] bg-[var(--accent-soft)]">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
        Progression promo
      </p>
      <p className="mt-2 text-lg">
        <Link
          href={context.studentUrl}
          className="font-semibold underline decoration-[var(--accent)] underline-offset-2 hover:text-[var(--accent-ink)]"
        >
          {context.student.displayName}
        </Link>
        <span className="text-[var(--muted)]"> · </span>
        <span>{context.exercise.title}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Promo{" "}
        <Link href={context.cohortUrl} className="underline underline-offset-2">
          {context.cohort.name}
        </Link>
        {context.submission.isValidated ? " · validé" : " · en cours"} · v
        {context.submission.currentVersion}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={context.studentUrl} className="btn-primary">
          Fiche élève
        </Link>
        <Link href={context.cohortUrl} className="btn-secondary">
          Dashboard promo
        </Link>
      </div>
    </section>
  );
}
