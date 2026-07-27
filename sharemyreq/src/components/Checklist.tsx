import type { ChecklistItem } from "@/lib/types";

const toneClass: Record<ChecklistItem["status"], string> = {
  ok: "badge-ok",
  warn: "badge-warn",
  fail: "badge-fail",
  info: "badge-info",
};

const toneLabel: Record<ChecklistItem["status"], string> = {
  ok: "OK",
  warn: "Attention",
  fail: "À corriger",
  info: "Info",
};

export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <section className="panel">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Checklist formateur</h2>
          <p className="section-sub">
            Lecture rapide avant même d’ouvrir le détail.
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-medium text-[var(--ink)]">{item.label}</p>
              <p className="mt-1 break-all font-mono text-sm text-[var(--muted)]">
                {item.detail}
              </p>
            </div>
            <span className={toneClass[item.status]}>
              {toneLabel[item.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
