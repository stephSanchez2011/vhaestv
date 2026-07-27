# ShareMyReq (V1)

Outil de partage de requêtes HTTP pour la formation — comme ShareMyCode, mais pour headers / status / body.

## Concept

1. L’apprenant crée un snapshot (formulaire, curl/HAR, snippet fetch, ou inbox mock)
2. Il envoie le **lien formateur** (`/s/...?t=...`)
3. Le formateur voit checklist + critères + diff, laisse un retex
4. L’apprenant **met à jour le même lien** → nouvelle version + badge retex

## Démarrer

```bash
cd sharemyreq
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

Stockage local : SQLite `data/sharemyreq.db` (via `@libsql/client`).

## Routes

| Route | Rôle |
|-------|------|
| `/` | Landing |
| `/new` | Créer un partage (+ templates) |
| `/s/[id]` | Lecture publique |
| `/s/[id]?t=...` | Mode formateur (retex + critères) |
| `/e/[id]?token=...` | Édition apprenant |
| `/demo` | Démo one-click |
| `/privacy` `/terms` | Légal |
| `/api/shares/[id]/inbox?token=...` | Inbox mock (capture HTTP) |
| `/api/shares/[id]/capture` | Capture depuis snippet fetch |

## Schéma V2 progression école

Le schéma SQL exact (tables, clés, indexes, KPI) est documenté ici :

- `docs/v2-progress-schema.md`

### API V2

| Route | Méthode | Rôle |
|-------|---------|------|
| `/api/v2/cohorts` | GET/POST | Lister / créer une promo |
| `/api/v2/cohorts/[id]/students` | POST | Ajouter un élève |
| `/api/v2/cohorts/[id]/exercises` | POST | Ajouter un exercice |
| `/api/v2/cohorts/[id]/dashboard` | GET | KPI + tableau promo |
| `/api/v2/students/[id]/progress` | GET | Fiche progression élève |
| `/api/v2/submissions/link-share` | POST | Lier un share à élève/exercice |
| `/api/v2/demo/seed` | POST | Promo démo + rendu lié |

### UI Dashboard

- `/dashboard` — liste promos
- `/dashboard/[id]` — tableau élèves × exercices
- `/dashboard/students/[id]` — fiche élève

## Déploiement Vercel + Turso

1. Crée une DB Turso (`turso db create sharemyreq`)
2. Copie `.env.example` → variables Vercel :
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
3. Depuis `/sharemyreq` : `vercel` (Root Directory = `sharemyreq` si monorepo)

Sans Turso, le fichier SQLite local ne persiste pas sur le filesystem serverless.

## Sécurité V1

- Lecture publique si l’id est connu
- Écriture apprenant : `editToken`
- Écriture formateur : `trainerToken`
- Headers sensibles masqués à l’affichage
- TTL 72 h (7 j pour `/demo`)

## Tests

```bash
npm run test:import
npm run build
```
