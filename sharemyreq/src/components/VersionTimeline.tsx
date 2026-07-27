import type { RequestVersion } from "@/lib/types";

type Props = {
  versions: RequestVersion[];
  selectedVersion: number;
  onSelect: (version: number) => void;
};

export function VersionTimeline({
  versions,
  selectedVersion,
  onSelect,
}: Props) {
  const ordered = [...versions].reverse();

  return (
    <section className="panel">
      <h2 className="section-title">Versions</h2>
      <p className="section-sub mb-4">
        Même lien, historique conservé — le progrès reste visible.
      </p>
      <ol className="space-y-3">
        {ordered.map((version) => {
          const active = version.version === selectedVersion;
          return (
            <li key={version.id}>
              <button
                type="button"
                onClick={() => onSelect(version.version)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--ink)]">
                    v{version.version}
                  </span>
                  {version.afterFeedback && (
                    <span className="badge-rework">Retravaillé après retex</span>
                  )}
                  {version.version === versions.length && (
                    <span className="badge-info">Courante</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {new Date(version.createdAt).toLocaleString("fr-FR")}
                  {version.snapshot.note
                    ? ` — ${version.snapshot.note}`
                    : ""}
                </p>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
