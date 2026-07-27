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
    })();
  }
  await ready;
}
