export default function PrivacyPage() {
  return (
    <article className="prose-like mx-auto max-w-3xl space-y-4 pt-8">
      <h1 className="font-[family-name:var(--font-brand)] text-4xl tracking-tight">
        Confidentialité
      </h1>
      <p className="text-[var(--muted)]">Dernière mise à jour : juillet 2026</p>

      <section className="panel space-y-3 text-[var(--ink)]">
        <p>
          ShareMyReq est un outil de partage de snapshots HTTP pour la formation.
          Nous collectons uniquement les données que vous saisissez volontairement
          dans un partage (URL, headers, bodies, notes, retours formateur).
        </p>
        <p>
          Les headers sensibles (`Authorization`, cookies, clés API) sont masqués
          dans l’interface de lecture. Évitez d’y coller des secrets de production.
        </p>
        <p>
          Les partages expirent automatiquement (72 h par défaut, 7 jours pour les
          démos). Passé ce délai, ils ne sont plus accessibles.
        </p>
        <p>
          Hébergement : selon votre déploiement (ex. Vercel + Turso). Aucune donnée
          n’est revendue. Pour une demande de suppression anticipée, contactez
          l’opérateur de l’instance.
        </p>
        <p>
          Les tokens d’édition et formateur donnent accès aux actions d’écriture.
          Conservez-les comme des mots de passe de session courte.
        </p>
      </section>
    </article>
  );
}
