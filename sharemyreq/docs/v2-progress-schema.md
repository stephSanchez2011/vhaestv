# V2 Progression Schema (écoles / promos / élèves)

Ce document décrit la couche relationnelle ajoutée au modèle V1 `shares`.

## Objectif

Passer d'un lien isolé à un suivi pédagogique :

- progression par élève
- vue agrégée promo
- KPI de correction (temps, taux de validation, rework)

## Tables existantes (V1)

### `shares`

Stocke le rendu brut (snapshot/version/feedback) utilisé par les pages:

- `/s/[id]`
- `/e/[id]`

Colonnes clés:

- `id` (PK)
- `edit_token` (écriture apprenant)
- `trainer_token` (écriture formateur)
- `expected_json`
- `versions_json`
- `feedback_json`

## Tables V2 (progression)

### `schools`

Un établissement (ou organisme de formation).

```sql
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
slug TEXT NOT NULL UNIQUE,
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
```

### `cohorts`

Une promo / classe rattachée à une école.

```sql
id TEXT PRIMARY KEY,
school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
name TEXT NOT NULL,
code TEXT,
start_date TEXT,
end_date TEXT,
status TEXT NOT NULL DEFAULT 'active',
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
```

Index: `idx_cohorts_school (school_id)`

### `cohort_trainers`

Formateurs associés à une promo (prêt pour SSO).

```sql
id TEXT PRIMARY KEY,
cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
display_name TEXT NOT NULL,
email TEXT,
auth_provider TEXT,
auth_subject TEXT,
created_at TEXT NOT NULL
```

Indexes:

- `idx_trainers_cohort (cohort_id)`
- `idx_trainers_auth UNIQUE (auth_provider, auth_subject)`

### `students`

Élèves d'une promo.

```sql
id TEXT PRIMARY KEY,
cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
display_name TEXT NOT NULL,
email TEXT,
external_ref TEXT,
status TEXT NOT NULL DEFAULT 'active',
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
```

Indexes:

- `idx_students_cohort (cohort_id)`
- `idx_students_cohort_ref UNIQUE (cohort_id, external_ref)`

### `exercises`

Exercices suivis dans une promo (avec attendu JSON).

```sql
id TEXT PRIMARY KEY,
cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
title TEXT NOT NULL,
slug TEXT NOT NULL,
description TEXT,
expected_json TEXT NOT NULL,
is_active INTEGER NOT NULL DEFAULT 1,
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
```

Index: `idx_exercises_cohort_slug UNIQUE (cohort_id, slug)`

### `submissions`

Lien entre un `share` V1 et le contexte école/promo/élève/exercice.

```sql
id TEXT PRIMARY KEY,
share_id TEXT NOT NULL UNIQUE REFERENCES shares(id) ON DELETE CASCADE,
cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
current_version INTEGER NOT NULL DEFAULT 1,
is_validated INTEGER NOT NULL DEFAULT 0,
validated_at TEXT,
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
```

Indexes:

- `idx_submissions_student (student_id)`
- `idx_submissions_exercise (exercise_id)`
- `idx_submissions_cohort (cohort_id)`

### `submission_versions`

Metrics par version (pour courbes et temps de progression).

```sql
id TEXT PRIMARY KEY,
submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
share_version INTEGER NOT NULL,
score_ok INTEGER NOT NULL DEFAULT 0,
score_warn INTEGER NOT NULL DEFAULT 0,
score_fail INTEGER NOT NULL DEFAULT 0,
score_ratio REAL NOT NULL DEFAULT 0,
reworked_after_feedback INTEGER NOT NULL DEFAULT 0,
captured_at TEXT NOT NULL,
note TEXT
```

Indexes:

- `idx_submission_versions_unique UNIQUE (submission_id, share_version)`
- `idx_submission_versions_submission (submission_id)`

### `submission_checks`

Détail des checks (auth, status, json...) par version.

```sql
id TEXT PRIMARY KEY,
submission_version_id TEXT NOT NULL REFERENCES submission_versions(id) ON DELETE CASCADE,
check_id TEXT NOT NULL,
check_label TEXT NOT NULL,
check_status TEXT NOT NULL,
check_detail TEXT NOT NULL
```

Index: `idx_submission_checks_version (submission_version_id)`

## Mapping métier

- `schools` -> multi-organisation
- `cohorts` -> promo (tableau global)
- `students` -> fiche élève
- `exercises` -> colonnes d'un tableau de suivi
- `submissions` -> un rendu lié à un share V1
- `submission_versions` -> timeline de progrès
- `submission_checks` -> diagnostics détaillés

## KPI calculables immédiatement

1. `% validation par exercice`
2. `temps médian v1 -> validé`
3. `% reworked_after_feedback`
4. `compétence la plus bloquante` (top `check_status='fail'`)

## SQL exemples (reporting)

### 1) Taux de validation par exercice

```sql
SELECT
  e.id,
  e.title,
  COUNT(s.id) AS total,
  SUM(CASE WHEN s.is_validated = 1 THEN 1 ELSE 0 END) AS validated,
  ROUND(100.0 * SUM(CASE WHEN s.is_validated = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(s.id), 0), 1) AS validation_rate
FROM exercises e
LEFT JOIN submissions s ON s.exercise_id = e.id
WHERE e.cohort_id = ?
GROUP BY e.id, e.title
ORDER BY e.title;
```

### 2) Élèves bloqués (>2 versions et pas validé)

```sql
SELECT
  st.display_name,
  e.title,
  s.current_version
FROM submissions s
JOIN students st ON st.id = s.student_id
JOIN exercises e ON e.id = s.exercise_id
WHERE s.cohort_id = ?
  AND s.is_validated = 0
  AND s.current_version >= 3
ORDER BY s.current_version DESC;
```

### 3) Compétences les plus en échec

```sql
SELECT
  sc.check_id,
  sc.check_label,
  COUNT(*) AS fail_count
FROM submission_checks sc
JOIN submission_versions sv ON sv.id = sc.submission_version_id
JOIN submissions s ON s.id = sv.submission_id
WHERE s.cohort_id = ?
  AND sc.check_status = 'fail'
GROUP BY sc.check_id, sc.check_label
ORDER BY fail_count DESC;
```

## Étape suivante (implémentation API)

Créer des endpoints V2:

- `POST /api/v2/cohorts`
- `POST /api/v2/cohorts/:id/students`
- `POST /api/v2/cohorts/:id/exercises`
- `POST /api/v2/submissions/link-share`
- `GET /api/v2/cohorts/:id/dashboard`
- `GET /api/v2/students/:id/progress`

