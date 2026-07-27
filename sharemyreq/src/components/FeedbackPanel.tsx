"use client";

import { useState } from "react";
import type { FeedbackItem, PublicShare } from "@/lib/types";

type Props = {
  shareId: string;
  feedback: FeedbackItem[];
  trainerToken: string;
  onUpdated: (share: PublicShare) => void;
};

export function FeedbackPanel({
  shareId,
  feedback,
  trainerToken,
  onUpdated,
}: Props) {
  const [message, setMessage] = useState("");
  const [authorLabel, setAuthorLabel] = useState("Formateur");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/shares/${shareId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, authorLabel, trainerToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      onUpdated(data.share);
      setMessage("");
    } catch {
      setError("Impossible d’envoyer le retour.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel space-y-4">
      <div>
        <h2 className="section-title">Retex formateur</h2>
        <p className="section-sub">
          L’apprenant verra ce retour sur son lien d’édition.
        </p>
      </div>

      {feedback.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Aucun retour pour l’instant.</p>
      ) : (
        <ul className="space-y-3">
          {[...feedback].reverse().map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3"
            >
              <p className="text-sm text-[var(--muted)]">
                {item.authorLabel} · sur v{item.targetVersion} ·{" "}
                {new Date(item.createdAt).toLocaleString("fr-FR")}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[var(--ink)]">
                {item.message}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-[var(--line)] pt-4">
        <label className="block space-y-2">
          <span className="label">Ton nom</span>
          <input
            className="field"
            value={authorLabel}
            onChange={(e) => setAuthorLabel(e.target.value)}
          />
        </label>
        <label className="block space-y-2">
          <span className="label">Retour</span>
          <textarea
            className="field min-h-28"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex. Ajoute Authorization: Bearer … et un Content-Type JSON."
          />
        </label>
        {error && (
          <p className="text-sm text-red-700">{error}</p>
        )}
        <button
          type="button"
          className="btn-secondary"
          disabled={pending || !message.trim()}
          onClick={submit}
        >
          {pending ? "Envoi…" : "Envoyer le retex"}
        </button>
      </div>
    </section>
  );
}
