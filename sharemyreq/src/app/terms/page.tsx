export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 pt-8">
      <h1 className="font-[family-name:var(--font-brand)] text-4xl tracking-tight">
        Conditions d’utilisation
      </h1>
      <p className="text-[var(--muted)]">Dernière mise à jour : juillet 2026</p>

      <section className="panel space-y-3">
        <p>
          ShareMyReq est fourni « en l’état » pour faciliter la correction de
          requêtes HTTP en contexte pédagogique.
        </p>
        <p>
          Vous êtes responsable du contenu partagé (pas de données personnelles
          sensibles inutiles, pas de secrets de production, respect du droit des
          élèves / stagiaires).
        </p>
        <p>
          L’outil ne remplace pas un environnement d’examen sécurisé. Les liens
          de lecture sont publics si l’identifiant est connu ; les actions
          formateur nécessitent un token.
        </p>
        <p>
          L’opérateur peut limiter, suspendre ou supprimer des contenus abusifs.
          Aucune garantie de disponibilité 24/7 sur la V1.
        </p>
      </section>
    </article>
  );
}
