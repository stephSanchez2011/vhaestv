import Link from "next/link";

export default function HomePage() {
  return (
    <div className="hero-grid">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-ink)]">
          Pour formateurs web & API
        </p>
        <h1 className="hero-title">
          L’élève partage une URL.
          <br />
          Tu vois si la requête tient la route.
        </h1>
        <p className="hero-copy">
          Comme ShareMyCode, mais pour le HTTP : headers, status, body, checklist
          pédagogique — et le même lien se met à jour après ton retex, avec
          l’historique des versions.
        </p>
        <div className="hero-actions">
          <Link href="/new" className="btn-primary">
            Créer un partage
          </Link>
          <a href="#comment-ca-marche" className="btn-secondary">
            Comment ça marche
          </a>
        </div>
      </section>

      <aside className="hero-card" aria-label="Aperçu formateur">
        <p className="text-sm font-semibold text-[var(--muted)]">
          Vue formateur · v3
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="badge-ok">Authorization OK</span>
          <span className="badge-ok">JSON valide</span>
          <span className="badge-rework">Retravaillé après retex</span>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--code-bg)] p-4 font-mono text-sm text-[var(--code-ink)]">
{`POST /api/login
Authorization: Bearer ••••••••
Content-Type: application/json
status: 200 OK`}
        </pre>
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3 text-sm">
          <p className="font-semibold">Diff v2 → v3</p>
          <p className="mt-1 font-mono text-[var(--ok)]">
            + Authorization: Bearer …
          </p>
          <p className="font-mono text-[var(--ok)]">+ status: 401 → 200</p>
        </div>
      </aside>

      <section id="comment-ca-marche" className="panel sm:col-span-2">
        <h2 className="section-title">Flow V1</h2>
        <div className="mt-2">
          <div className="flow-step">
            <div className="flow-index">1</div>
            <div>
              <p className="font-semibold">L’apprenant capture sa requête</p>
              <p className="text-[var(--muted)]">
                Colle un curl / HAR depuis DevTools, ou saisit méthode, URL,
                headers, body, status — même sans backend prêt.
              </p>
            </div>
          </div>
          <div className="flow-step">
            <div className="flow-index">2</div>
            <div>
              <p className="font-semibold">Il envoie le lien formateur</p>
              <p className="text-[var(--muted)]">
                Tu ouvres `/s/...` et tu as la checklist en un coup d’œil.
              </p>
            </div>
          </div>
          <div className="flow-step">
            <div className="flow-index">3</div>
            <div>
              <p className="font-semibold">Tu laisses un retex</p>
              <p className="text-[var(--muted)]">
                L’élève met à jour le même lien. Tu vois v1 → v2 → v3 et le diff.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
