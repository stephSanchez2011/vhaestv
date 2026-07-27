import { nanoid } from "nanoid";
import { emptyExpected } from "./checklist";
import { ensureSchema, getDb } from "./db";
import type {
  ExpectedCriteria,
  FeedbackItem,
  PublicShare,
  RequestSnapshot,
  RequestVersion,
  ShareRecord,
} from "./types";

const DEFAULT_TTL_HOURS = 72;

type ShareRow = {
  id: string;
  edit_token: string;
  trainer_token: string;
  title: string;
  student_label: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  expected_json: string;
  versions_json: string;
  feedback_json: string;
};

function isExpired(share: ShareRecord): boolean {
  return new Date(share.expiresAt).getTime() < Date.now();
}

function rowToShare(row: ShareRow): ShareRecord {
  return {
    id: row.id,
    editToken: row.edit_token,
    trainerToken: row.trainer_token,
    title: row.title,
    studentLabel: row.student_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    expected: {
      ...emptyExpected(),
      ...(JSON.parse(row.expected_json) as ExpectedCriteria),
    },
    versions: JSON.parse(row.versions_json) as RequestVersion[],
    feedback: JSON.parse(row.feedback_json) as FeedbackItem[],
  };
}

async function saveShare(share: ShareRecord): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `
      INSERT INTO shares (
        id, edit_token, trainer_token, title, student_label,
        created_at, updated_at, expires_at, expected_json, versions_json, feedback_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        edit_token = excluded.edit_token,
        trainer_token = excluded.trainer_token,
        title = excluded.title,
        student_label = excluded.student_label,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at,
        expected_json = excluded.expected_json,
        versions_json = excluded.versions_json,
        feedback_json = excluded.feedback_json
    `,
    args: [
      share.id,
      share.editToken,
      share.trainerToken,
      share.title,
      share.studentLabel,
      share.createdAt,
      share.updatedAt,
      share.expiresAt,
      JSON.stringify(share.expected),
      JSON.stringify(share.versions),
      JSON.stringify(share.feedback),
    ],
  });
}

async function loadShare(id: string): Promise<ShareRecord | null> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM shares WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const row = result.rows[0] as unknown as ShareRow | undefined;
  if (!row) return null;
  const share = rowToShare(row);
  if (isExpired(share)) return null;
  return share;
}

export function toPublicShare(share: ShareRecord): PublicShare {
  const { editToken: _e, trainerToken: _t, ...rest } = share;
  return rest;
}

export function assertTrainerAccess(
  share: ShareRecord,
  trainerToken?: string | null,
): boolean {
  return Boolean(trainerToken && trainerToken === share.trainerToken);
}

export function assertEditorAccess(
  share: ShareRecord,
  editToken?: string | null,
): boolean {
  return Boolean(editToken && editToken === share.editToken);
}

export async function createShare(input: {
  title: string;
  studentLabel: string;
  snapshot: RequestSnapshot;
  ttlHours?: number;
  expected?: ExpectedCriteria;
}): Promise<{ share: ShareRecord; editToken: string; trainerToken: string }> {
  const now = new Date();
  const ttl = input.ttlHours ?? DEFAULT_TTL_HOURS;
  const id = nanoid(10);
  const editToken = nanoid(24);
  const trainerToken = nanoid(24);

  const share: ShareRecord = {
    id,
    editToken,
    trainerToken,
    title: input.title.trim() || "Requête API",
    studentLabel: input.studentLabel.trim() || "Apprenant",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl * 60 * 60 * 1000).toISOString(),
    expected: input.expected ?? emptyExpected(),
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

  await saveShare(share);
  await import("./v2-store")
    .then(({ syncSubmissionFromShare }) => syncSubmissionFromShare(id))
    .catch(() => undefined);
  return { share, editToken, trainerToken };
}

export async function getShare(id: string): Promise<ShareRecord | null> {
  return loadShare(id);
}

export async function addVersion(
  id: string,
  editToken: string,
  snapshot: RequestSnapshot,
  options?: { afterFeedback?: boolean; note?: string },
): Promise<ShareRecord | null> {
  const share = await loadShare(id);
  if (!share || !assertEditorAccess(share, editToken)) return null;

  const now = new Date().toISOString();
  const nextVersion = share.versions.length + 1;
  const previousFeedbackCount = share.feedback.length;

  share.versions.push({
    id: nanoid(8),
    version: nextVersion,
    createdAt: now,
    afterFeedback: options?.afterFeedback ?? previousFeedbackCount > 0,
    snapshot: {
      ...snapshot,
      note: options?.note?.trim() || snapshot.note,
    },
  });
  share.updatedAt = now;
  await saveShare(share);
  await import("./v2-store")
    .then(({ syncSubmissionFromShare }) => syncSubmissionFromShare(id))
    .catch(() => undefined);
  return share;
}

export async function addFeedback(
  id: string,
  input: { message: string; authorLabel?: string },
  trainerToken: string,
): Promise<ShareRecord | null> {
  const share = await loadShare(id);
  if (!share || !assertTrainerAccess(share, trainerToken)) return null;

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
  await saveShare(share);
  return share;
}

export async function updateExpected(
  id: string,
  expected: ExpectedCriteria,
  trainerToken: string,
): Promise<ShareRecord | null> {
  const share = await loadShare(id);
  if (!share || !assertTrainerAccess(share, trainerToken)) return null;

  share.expected = {
    method: expected.method || "",
    urlIncludes: expected.urlIncludes?.trim() || "",
    requiredHeaders: (expected.requiredHeaders || [])
      .map((h) => h.trim())
      .filter(Boolean),
    expectedStatus:
      expected.expectedStatus == null || Number.isNaN(expected.expectedStatus)
        ? null
        : Number(expected.expectedStatus),
    requireAuthorization: Boolean(expected.requireAuthorization),
    requireJsonBody: Boolean(expected.requireJsonBody),
  };
  share.updatedAt = new Date().toISOString();
  await saveShare(share);
  await import("./v2-store")
    .then(({ syncSubmissionFromShare }) => syncSubmissionFromShare(id))
    .catch(() => undefined);
  return share;
}

export function latestVersion(share: ShareRecord) {
  return share.versions[share.versions.length - 1];
}
