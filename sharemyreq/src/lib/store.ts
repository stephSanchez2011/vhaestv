import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type {
  FeedbackItem,
  PublicShare,
  RequestSnapshot,
  ShareRecord,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "shares.json");
const DEFAULT_TTL_HOURS = 72;

type DbShape = {
  shares: ShareRecord[];
};

async function ensureDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    const initial: DbShape = { shares: [] };
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readDb(): Promise<DbShape> {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, "utf8");
  return JSON.parse(raw) as DbShape;
}

async function writeDb(db: DbShape): Promise<void> {
  await ensureDb();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function isExpired(share: ShareRecord): boolean {
  return new Date(share.expiresAt).getTime() < Date.now();
}

export function toPublicShare(share: ShareRecord): PublicShare {
  const { editToken: _editToken, ...rest } = share;
  return rest;
}

export async function createShare(input: {
  title: string;
  studentLabel: string;
  snapshot: RequestSnapshot;
  ttlHours?: number;
}): Promise<{ share: ShareRecord; editToken: string }> {
  const db = await readDb();
  const now = new Date();
  const ttl = input.ttlHours ?? DEFAULT_TTL_HOURS;
  const id = nanoid(10);
  const editToken = nanoid(24);

  const share: ShareRecord = {
    id,
    editToken,
    title: input.title.trim() || "Requête API",
    studentLabel: input.studentLabel.trim() || "Apprenant",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl * 60 * 60 * 1000).toISOString(),
    versions: [
      {
        id: nanoid(8),
        version: 1,
        createdAt: now.toISOString(),
        afterFeedback: false,
        snapshot: input.snapshot,
      },
    ],
    feedback: [],
  };

  db.shares.unshift(share);
  await writeDb(db);
  return { share, editToken };
}

export async function getShare(id: string): Promise<ShareRecord | null> {
  const db = await readDb();
  const share = db.shares.find((item) => item.id === id);
  if (!share) return null;
  if (isExpired(share)) return null;
  return share;
}

export async function addVersion(
  id: string,
  editToken: string,
  snapshot: RequestSnapshot,
  options?: { afterFeedback?: boolean; note?: string },
): Promise<ShareRecord | null> {
  const db = await readDb();
  const share = db.shares.find((item) => item.id === id);
  if (!share || isExpired(share)) return null;
  if (share.editToken !== editToken) return null;

  const now = new Date().toISOString();
  const nextVersion = share.versions.length + 1;
  const previousFeedbackCount = share.feedback.length;

  share.versions.push({
    id: nanoid(8),
    version: nextVersion,
    createdAt: now,
    afterFeedback:
      options?.afterFeedback ?? previousFeedbackCount > 0,
    snapshot: {
      ...snapshot,
      note: options?.note?.trim() || snapshot.note,
    },
  });
  share.updatedAt = now;

  await writeDb(db);
  return share;
}

export async function addFeedback(
  id: string,
  input: { message: string; authorLabel?: string },
): Promise<ShareRecord | null> {
  const db = await readDb();
  const share = db.shares.find((item) => item.id === id);
  if (!share || isExpired(share)) return null;

  const message = input.message.trim();
  if (!message) return null;

  const latestVersion = share.versions[share.versions.length - 1]?.version ?? 1;
  const item: FeedbackItem = {
    id: nanoid(8),
    createdAt: new Date().toISOString(),
    authorLabel: input.authorLabel?.trim() || "Formateur",
    message,
    targetVersion: latestVersion,
  };

  share.feedback.push(item);
  share.updatedAt = new Date().toISOString();
  await writeDb(db);
  return share;
}

export function latestVersion(share: ShareRecord) {
  return share.versions[share.versions.length - 1];
}
