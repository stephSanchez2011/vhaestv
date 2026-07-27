import { createClient, type Client } from "@libsql/client";
import { promises as fs } from "fs";
import path from "path";

let client: Client | null = null;
let ready: Promise<void> | null = null;

function resolveDbUrl(): { url: string; authToken?: string } {
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  }

  const dataDir = path.join(process.cwd(), "data");
  const filePath = path.join(dataDir, "sharemyreq.db");
  return { url: `file:${filePath}` };
}

export function getDb(): Client {
  if (!client) {
    const config = resolveDbUrl();
    client = createClient({
      url: config.url,
      authToken: config.authToken,
    });
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      if (!process.env.TURSO_DATABASE_URL) {
        await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
      }
      const db = getDb();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS shares (
          id TEXT PRIMARY KEY,
          edit_token TEXT NOT NULL,
          trainer_token TEXT NOT NULL,
          title TEXT NOT NULL,
          student_label TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          expected_json TEXT NOT NULL,
          versions_json TEXT NOT NULL,
          feedback_json TEXT NOT NULL
        )
      `);
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares(expires_at)`,
      );

      // V2 progression model for school/cohort/student level tracking.
      await db.execute(`
        CREATE TABLE IF NOT EXISTS schools (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS cohorts (
          id TEXT PRIMARY KEY,
          school_id TEXT NOT NULL,
          name TEXT NOT NULL,
          code TEXT,
          start_date TEXT,
          end_date TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_cohorts_school ON cohorts(school_id)`,
      );

      await db.execute(`
        CREATE TABLE IF NOT EXISTS cohort_trainers (
          id TEXT PRIMARY KEY,
          cohort_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          email TEXT,
          auth_provider TEXT,
          auth_subject TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_trainers_cohort ON cohort_trainers(cohort_id)`,
      );
      await db.execute(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_trainers_auth ON cohort_trainers(auth_provider, auth_subject)`,
      );

      await db.execute(`
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          cohort_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          email TEXT,
          external_ref TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_students_cohort ON students(cohort_id)`,
      );
      await db.execute(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_students_cohort_ref ON students(cohort_id, external_ref)`,
      );

      await db.execute(`
        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY,
          cohort_id TEXT NOT NULL,
          title TEXT NOT NULL,
          slug TEXT NOT NULL,
          description TEXT,
          expected_json TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_cohort_slug ON exercises(cohort_id, slug)`,
      );

      await db.execute(`
        CREATE TABLE IF NOT EXISTS submissions (
          id TEXT PRIMARY KEY,
          share_id TEXT NOT NULL UNIQUE,
          cohort_id TEXT NOT NULL,
          student_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          current_version INTEGER NOT NULL DEFAULT 1,
          is_validated INTEGER NOT NULL DEFAULT 0,
          validated_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE,
          FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id)`,
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_submissions_exercise ON submissions(exercise_id)`,
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_submissions_cohort ON submissions(cohort_id)`,
      );

      await db.execute(`
        CREATE TABLE IF NOT EXISTS submission_versions (
          id TEXT PRIMARY KEY,
          submission_id TEXT NOT NULL,
          share_version INTEGER NOT NULL,
          score_ok INTEGER NOT NULL DEFAULT 0,
          score_warn INTEGER NOT NULL DEFAULT 0,
          score_fail INTEGER NOT NULL DEFAULT 0,
          score_ratio REAL NOT NULL DEFAULT 0,
          reworked_after_feedback INTEGER NOT NULL DEFAULT 0,
          captured_at TEXT NOT NULL,
          note TEXT,
          FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_submission_versions_unique ON submission_versions(submission_id, share_version)`,
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_submission_versions_submission ON submission_versions(submission_id)`,
      );

      await db.execute(`
        CREATE TABLE IF NOT EXISTS submission_checks (
          id TEXT PRIMARY KEY,
          submission_version_id TEXT NOT NULL,
          check_id TEXT NOT NULL,
          check_label TEXT NOT NULL,
          check_status TEXT NOT NULL,
          check_detail TEXT NOT NULL,
          FOREIGN KEY (submission_version_id) REFERENCES submission_versions(id) ON DELETE CASCADE
        )
      `);
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_submission_checks_version ON submission_checks(submission_version_id)`,
      );
    })();
  }
  await ready;
}
