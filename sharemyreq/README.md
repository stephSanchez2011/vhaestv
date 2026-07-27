# ShareMyReq (V1)

Outil de partage de requêtes HTTP pour la formation — comme ShareMyCode, mais pour headers / status / body.

## Concept

1. L’apprenant crée un snapshot de sa requête
2. Il envoie le **lien formateur** (`/s/...`)
3. Le formateur voit une checklist + le détail, laisse un retex
4. L’apprenant **met à jour le même lien** → nouvelle version + badge “Retravaillé après retex” + diff

## Démarrer

```bash
cd sharemyreq
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Rôle |
|-------|------|
| `/` | Landing |
| `/new` | Créer un partage (apprenant) |
| `/s/[id]` | Vue formateur (lecture + retex) |
| `/e/[id]?token=...` | Édition apprenant (versions) |

## Stockage V1

Fichier JSON local : `data/shares.json` (gitignored).

TTL par défaut : **72 heures**.

## Import rapide

Sur `/new` et `/e/...`, colle :

- une commande **Copy as cURL** (Chrome/Firefox DevTools)
- ou un export **HAR** (JSON)

→ le formulaire se préremplit (méthode, URL, headers, body, et status si HAR).

## Hors scope V1

- Auth comptes
- Proxy live / extension Chrome
- Multi-formateurs / classes
- Paiement
