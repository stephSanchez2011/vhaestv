export default function NotFound() {
  return (
    <div className="panel mt-8">
      <h1 className="section-title">Partage introuvable</h1>
      <p className="mt-2 text-[var(--muted)]">
        Ce lien n’existe pas ou a expiré (durée de vie V1 : 72 h).
      </p>
    </div>
  );
}
