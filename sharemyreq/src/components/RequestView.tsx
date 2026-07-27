import { maskHeaders } from "@/lib/checklist";
import type { RequestSnapshot } from "@/lib/types";

function HeaderBlock({
  title,
  headers,
}: {
  title: string;
  headers: Record<string, string>;
}) {
  const masked = maskHeaders(headers);
  const entries = Object.entries(masked);

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Aucun header</p>
      ) : (
        <dl className="space-y-2 rounded-xl bg-[var(--panel-2)] p-3 font-mono text-sm">
          {entries.map(([key, value]) => (
            <div key={key} className="grid gap-1 sm:grid-cols-[180px_1fr]">
              <dt className="text-[var(--accent-ink)]">{key}</dt>
              <dd className="break-all text-[var(--ink)]">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function BodyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
      </h3>
      <pre className="overflow-x-auto rounded-xl bg-[var(--code-bg)] p-3 font-mono text-sm text-[var(--code-ink)]">
        {body.trim() ? body : "∅"}
      </pre>
    </div>
  );
}

export function RequestView({ snapshot }: { snapshot: RequestSnapshot }) {
  return (
    <section className="panel space-y-5">
      <div>
        <h2 className="section-title">Détail de la requête</h2>
        <p className="section-sub">
          Tokens sensibles masqués automatiquement.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-4">
        <p className="font-mono text-sm text-[var(--accent-ink)]">
          {snapshot.method}{" "}
          <span className="break-all text-[var(--ink)]">{snapshot.url}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Status:{" "}
          <span className="font-mono text-[var(--ink)]">
            {snapshot.status ?? "—"} {snapshot.statusText}
          </span>
          {snapshot.durationMs != null && (
            <>
              {" "}
              · {snapshot.durationMs} ms
            </>
          )}
        </p>
        {snapshot.note && (
          <p className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--ink)]">
            Note apprenant : {snapshot.note}
          </p>
        )}
      </div>

      <HeaderBlock title="Headers requête" headers={snapshot.requestHeaders} />
      <HeaderBlock title="Headers réponse" headers={snapshot.responseHeaders} />
      <BodyBlock title="Body requête" body={snapshot.requestBody} />
      <BodyBlock title="Body réponse" body={snapshot.responseBody} />
    </section>
  );
}
