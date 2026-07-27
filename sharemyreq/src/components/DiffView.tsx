import type { DiffChange } from "@/lib/types";

export function DiffView({ changes }: { changes: DiffChange[] }) {
  if (changes.length === 0) {
    return (
      <section className="panel">
        <h2 className="section-title">Diff vs version précédente</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Aucun changement détecté par rapport à la version précédente.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="section-title">Diff vs version précédente</h2>
      <p className="section-sub mb-4">
        Ce qui a bougé après le retex — idéal pour valider en 5 secondes.
      </p>
      <ul className="space-y-3">
        {changes.map((change) => (
          <li
            key={`${change.path}-${change.kind}`}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-[var(--ink)]">
                {change.path}
              </span>
              <span
                className={
                  change.kind === "added"
                    ? "badge-ok"
                    : change.kind === "removed"
                      ? "badge-fail"
                      : "badge-warn"
                }
              >
                {change.kind === "added"
                  ? "ajouté"
                  : change.kind === "removed"
                    ? "supprimé"
                    : "modifié"}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <pre className="overflow-x-auto rounded-lg bg-[#f4ebe0] p-2 font-mono text-xs text-[#7a3b2e]">
                − {change.before || "∅"}
              </pre>
              <pre className="overflow-x-auto rounded-lg bg-[#e7f3ea] p-2 font-mono text-xs text-[#1f5b38]">
                + {change.after || "∅"}
              </pre>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
