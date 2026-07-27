import { hasExpectedCriteria } from "@/lib/checklist";
import type { ExpectedCriteria } from "@/lib/types";

export function ExpectedSummary({ expected }: { expected: ExpectedCriteria }) {
  if (!hasExpectedCriteria(expected)) {
    return (
      <section className="panel">
        <h2 className="section-title">Critères du formateur</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Aucun critère spécifique pour l’instant — la checklist générique
          s’applique.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="section-title">Critères du formateur</h2>
      <p className="section-sub mb-3">
        Ta requête sera comparée à ça avant correction.
      </p>
      <ul className="space-y-2 text-sm">
        {expected.method && (
          <li>
            Méthode : <span className="font-mono">{expected.method}</span>
          </li>
        )}
        {expected.urlIncludes && (
          <li>
            URL contient :{" "}
            <span className="font-mono">{expected.urlIncludes}</span>
          </li>
        )}
        {expected.expectedStatus != null && (
          <li>
            Status :{" "}
            <span className="font-mono">{expected.expectedStatus}</span>
          </li>
        )}
        {expected.requireAuthorization && <li>Authorization obligatoire</li>}
        {expected.requireJsonBody && <li>Body JSON obligatoire</li>}
        {expected.requiredHeaders.map((header) => (
          <li key={header}>
            Header requis : <span className="font-mono">{header}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
