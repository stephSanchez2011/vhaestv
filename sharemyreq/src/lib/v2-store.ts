import { nanoid } from "nanoid";
import { buildChecklist, emptyExpected } from "./checklist";
import { ensureSchema, getDb } from "./db";
import { getShare } from "./store";
import type { ExpectedCriteria, ShareRecord } from "./types";
import { buildRenderLink } from "./magic-link";
import type {
  Cohort,
  CohortDashboard,
  DashboardExerciseCell,
  DashboardStudentRow,
  Exercise,
  ExerciseSlot,
  RenderContext,
  School,
  ShareProgressContext,
  Student,
  StudentProgress,
  Submission,
} from "./v2-types";

const VALIDATION_RATIO = 0.85;

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function computeMetrics(share: ShareRecord, versionNumber: number) {
  const version = share.versions.find((v) => v.version === versionNumber);
  if (!version) return null;

  const checklist = buildChecklist(version.snapshot, share.expected);
  const scored = checklist.filter((item) => item.status !== "info");
  const scoreOk = scored.filter((i) => i.status === "ok").length;
  const scoreWarn = scored.filter((i) => i.status === "warn").length;
  const scoreFail = scored.filter((i) => i.status === "fail").length;
  const denom = Math.max(1, scoreOk + scoreWarn + scoreFail);
  const scoreRatio = Math.round((scoreOk / denom) * 1000) / 1000;

  return {
    checklist,
    scoreOk,
    scoreWarn,
    scoreFail,
    scoreRatio,
    reworkedAfterFeedback: version.afterFeedback,
    capturedAt: version.createdAt,
    note: version.snapshot.note || null,
    isValidated: scoreFail === 0 && scoreRatio >= VALIDATION_RATIO,
  };
}

export async function getOrCreateDefaultSchool(name = "ShareMyReq"): Promise<School> {
  await ensureSchema();
  const db = getDb();
  const slug = slugify(name) || "sharemyreq";
  const existing = await db.execute({
    sql: `SELECT * FROM schools WHERE slug = ? LIMIT 1`,
    args: [slug],
  });
  const row = existing.rows[0] as Record<string, unknown> | undefined;
  if (row) {
    return {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  const id = nanoid(10);
  const ts = nowIso();
  await db.execute({
    sql: `INSERT INTO schools (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, name, slug, ts, ts],
  });
  return { id, name, slug, createdAt: ts, updatedAt: ts };
}

export async function createCohort(input: {
  name: string;
  code?: string;
  schoolName?: string;
}): Promise<Cohort> {
  const school = await getOrCreateDefaultSchool(input.schoolName);
  const id = nanoid(10);
  const ts = nowIso();
  await getDb().execute({
    sql: `
      INSERT INTO cohorts (
        id, school_id, name, code, start_date, end_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NULL, NULL, 'active', ?, ?)
    `,
    args: [id, school.id, input.name.trim(), input.code?.trim() || null, ts, ts],
  });
  return {
    id,
    schoolId: school.id,
    name: input.name.trim(),
    code: input.code?.trim() || null,
    startDate: null,
    endDate: null,
    status: "active",
    createdAt: ts,
    updatedAt: ts,
  };
}

export async function listCohorts(): Promise<Cohort[]> {
  await ensureSchema();
  const result = await getDb().execute(
    `SELECT * FROM cohorts ORDER BY created_at DESC LIMIT 100`,
  );
  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      schoolId: String(r.school_id),
      name: String(r.name),
      code: r.code ? String(r.code) : null,
      startDate: r.start_date ? String(r.start_date) : null,
      endDate: r.end_date ? String(r.end_date) : null,
      status: String(r.status) as Cohort["status"],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  });
}

export async function getCohort(id: string): Promise<Cohort | null> {
  await ensureSchema();
  const result = await getDb().execute({
    sql: `SELECT * FROM cohorts WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const r = result.rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    schoolId: String(r.school_id),
    name: String(r.name),
    code: r.code ? String(r.code) : null,
    startDate: r.start_date ? String(r.start_date) : null,
    endDate: r.end_date ? String(r.end_date) : null,
    status: String(r.status) as Cohort["status"],
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function addStudent(input: {
  cohortId: string;
  displayName: string;
  email?: string;
  externalRef?: string;
}): Promise<Student | null> {
  const cohort = await getCohort(input.cohortId);
  if (!cohort) return null;

  const id = nanoid(10);
  const ts = nowIso();
  await getDb().execute({
    sql: `
      INSERT INTO students (id, cohort_id, display_name, email, external_ref, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `,
    args: [
      id,
      input.cohortId,
      input.displayName.trim(),
      input.email?.trim() || null,
      input.externalRef?.trim() || null,
      ts,
      ts,
    ],
  });
  return {
    id,
    cohortId: input.cohortId,
    displayName: input.displayName.trim(),
    email: input.email?.trim() || null,
    externalRef: input.externalRef?.trim() || null,
    status: "active",
    createdAt: ts,
    updatedAt: ts,
  };
}

export async function addExercise(input: {
  cohortId: string;
  title: string;
  slug?: string;
  description?: string;
  expected?: ExpectedCriteria;
}): Promise<Exercise | null> {
  const cohort = await getCohort(input.cohortId);
  if (!cohort) return null;

  const id = nanoid(10);
  const ts = nowIso();
  const slug = slugify(input.slug || input.title) || `exercise-${id.slice(0, 4)}`;
  const expected = input.expected ?? emptyExpected();

  await getDb().execute({
    sql: `
      INSERT INTO exercises (
        id, cohort_id, title, slug, description, expected_json, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `,
    args: [
      id,
      input.cohortId,
      input.title.trim(),
      slug,
      input.description?.trim() || null,
      JSON.stringify(expected),
      ts,
      ts,
    ],
  });

  return {
    id,
    cohortId: input.cohortId,
    title: input.title.trim(),
    slug,
    description: input.description?.trim() || null,
    expected,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  };
}

export async function getSubmissionByShareId(
  shareId: string,
): Promise<Submission | null> {
  await ensureSchema();
  const result = await getDb().execute({
    sql: `SELECT * FROM submissions WHERE share_id = ? LIMIT 1`,
    args: [shareId],
  });
  const r = result.rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    shareId: String(r.share_id),
    cohortId: String(r.cohort_id),
    studentId: String(r.student_id),
    exerciseId: String(r.exercise_id),
    currentVersion: Number(r.current_version),
    isValidated: Boolean(r.is_validated),
    validatedAt: r.validated_at ? String(r.validated_at) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function syncSubmissionFromShare(shareId: string): Promise<void> {
  const submission = await getSubmissionByShareId(shareId);
  const share = await getShare(shareId);
  if (!submission || !share) return;

  const db = getDb();
  const ts = nowIso();

  for (const version of share.versions) {
    const metrics = computeMetrics(share, version.version);
    if (!metrics) continue;

    const versionId = nanoid(8);
    await db.execute({
      sql: `
        INSERT INTO submission_versions (
          id, submission_id, share_version, score_ok, score_warn, score_fail,
          score_ratio, reworked_after_feedback, captured_at, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(submission_id, share_version) DO UPDATE SET
          score_ok = excluded.score_ok,
          score_warn = excluded.score_warn,
          score_fail = excluded.score_fail,
          score_ratio = excluded.score_ratio,
          reworked_after_feedback = excluded.reworked_after_feedback,
          captured_at = excluded.captured_at,
          note = excluded.note
      `,
      args: [
        versionId,
        submission.id,
        version.version,
        metrics.scoreOk,
        metrics.scoreWarn,
        metrics.scoreFail,
        metrics.scoreRatio,
        metrics.reworkedAfterFeedback ? 1 : 0,
        metrics.capturedAt,
        metrics.note,
      ],
    });

    const versionRow = await db.execute({
      sql: `SELECT id FROM submission_versions WHERE submission_id = ? AND share_version = ? LIMIT 1`,
      args: [submission.id, version.version],
    });
    const svId = String(
      (versionRow.rows[0] as Record<string, unknown> | undefined)?.id || versionId,
    );

    await db.execute({
      sql: `DELETE FROM submission_checks WHERE submission_version_id = ?`,
      args: [svId],
    });

    for (const check of metrics.checklist) {
      if (check.status === "info") continue;
      await db.execute({
        sql: `
          INSERT INTO submission_checks (
            id, submission_version_id, check_id, check_label, check_status, check_detail
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [nanoid(8), svId, check.id, check.label, check.status, check.detail],
      });
    }
  }

  const latest = share.versions[share.versions.length - 1];
  const latestMetrics = latest ? computeMetrics(share, latest.version) : null;

  await db.execute({
    sql: `
      UPDATE submissions
      SET current_version = ?, is_validated = ?, validated_at = ?, updated_at = ?
      WHERE id = ?
    `,
    args: [
      latest?.version ?? submission.currentVersion,
      latestMetrics?.isValidated ? 1 : 0,
      latestMetrics?.isValidated ? ts : null,
      ts,
      submission.id,
    ],
  });
}

export async function linkShareToSubmission(input: {
  shareId: string;
  cohortId: string;
  studentId: string;
  exerciseId: string;
}): Promise<Submission | null> {
  const share = await getShare(input.shareId);
  const cohort = await getCohort(input.cohortId);
  if (!share || !cohort) return null;

  const db = getDb();
  const studentCheck = await db.execute({
    sql: `SELECT id FROM students WHERE id = ? AND cohort_id = ? LIMIT 1`,
    args: [input.studentId, input.cohortId],
  });
  if (!studentCheck.rows[0]) return null;

  const exerciseCheck = await db.execute({
    sql: `SELECT id FROM exercises WHERE id = ? AND cohort_id = ? LIMIT 1`,
    args: [input.exerciseId, input.cohortId],
  });
  if (!exerciseCheck.rows[0]) return null;

  const existing = await getSubmissionByShareId(input.shareId);
  if (existing) {
    await syncSubmissionFromShare(input.shareId);
    return existing;
  }

  const id = nanoid(10);
  const ts = nowIso();
  await db.execute({
    sql: `
      INSERT INTO submissions (
        id, share_id, cohort_id, student_id, exercise_id,
        current_version, is_validated, validated_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
    `,
    args: [
      id,
      input.shareId,
      input.cohortId,
      input.studentId,
      input.exerciseId,
      share.versions.length,
      ts,
      ts,
    ],
  });

  await syncSubmissionFromShare(input.shareId);
  return getSubmissionByShareId(input.shareId);
}

export async function getShareProgressContext(
  shareId: string,
): Promise<ShareProgressContext | null> {
  const submission = await getSubmissionByShareId(shareId);
  if (!submission) return null;

  const [student, exercise, cohort] = await Promise.all([
    getStudent(submission.studentId),
    getExercise(submission.exerciseId),
    getCohort(submission.cohortId),
  ]);
  if (!student || !exercise || !cohort) return null;

  return {
    shareId,
    submission,
    student,
    exercise,
    cohort,
    studentUrl: `/dashboard/students/${student.id}`,
    cohortUrl: `/dashboard/${cohort.id}`,
  };
}

export async function getStudent(studentId: string): Promise<Student | null> {
  await ensureSchema();
  const result = await getDb().execute({
    sql: `SELECT * FROM students WHERE id = ? LIMIT 1`,
    args: [studentId],
  });
  const r = result.rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    cohortId: String(r.cohort_id),
    displayName: String(r.display_name),
    email: r.email ? String(r.email) : null,
    externalRef: r.external_ref ? String(r.external_ref) : null,
    status: String(r.status) as Student["status"],
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function getExercise(exerciseId: string): Promise<Exercise | null> {
  await ensureSchema();
  const result = await getDb().execute({
    sql: `SELECT * FROM exercises WHERE id = ? LIMIT 1`,
    args: [exerciseId],
  });
  const r = result.rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    cohortId: String(r.cohort_id),
    title: String(r.title),
    slug: String(r.slug),
    description: r.description ? String(r.description) : null,
    expected: {
      ...emptyExpected(),
      ...(JSON.parse(String(r.expected_json)) as ExpectedCriteria),
    },
    isActive: Boolean(r.is_active),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function getSubmissionByStudentExercise(
  studentId: string,
  exerciseId: string,
): Promise<Submission | null> {
  await ensureSchema();
  const result = await getDb().execute({
    sql: `
      SELECT * FROM submissions
      WHERE student_id = ? AND exercise_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    args: [studentId, exerciseId],
  });
  const r = result.rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: String(r.id),
    shareId: String(r.share_id),
    cohortId: String(r.cohort_id),
    studentId: String(r.student_id),
    exerciseId: String(r.exercise_id),
    currentVersion: Number(r.current_version),
    isValidated: Boolean(r.is_validated),
    validatedAt: r.validated_at ? String(r.validated_at) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function getRenderContext(input: {
  cohortId: string;
  studentId: string;
  exerciseId: string;
}): Promise<RenderContext | null> {
  const cohort = await getCohort(input.cohortId);
  const student = await getStudent(input.studentId);
  const exercise = await getExercise(input.exerciseId);
  if (!cohort || !student || !exercise) return null;
  if (student.cohortId !== cohort.id || exercise.cohortId !== cohort.id) return null;

  const existing = await getSubmissionByStudentExercise(
    input.studentId,
    input.exerciseId,
  );

  let existingSubmission: RenderContext["existingSubmission"] = null;
  if (existing) {
    const share = await getShare(existing.shareId);
    if (share) {
      existingSubmission = {
        shareId: existing.shareId,
        editLink: `/e/${existing.shareId}?token=${share.editToken}`,
        shareLink: `/s/${existing.shareId}`,
      };
    }
  }

  return {
    cohort,
    student,
    exercise,
    existingSubmission,
  };
}

export async function listStudents(cohortId: string): Promise<Student[]> {
  const result = await getDb().execute({
    sql: `SELECT * FROM students WHERE cohort_id = ? ORDER BY display_name ASC`,
    args: [cohortId],
  });
  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      cohortId: String(r.cohort_id),
      displayName: String(r.display_name),
      email: r.email ? String(r.email) : null,
      externalRef: r.external_ref ? String(r.external_ref) : null,
      status: String(r.status) as Student["status"],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  });
}

export async function listExercises(cohortId: string): Promise<Exercise[]> {
  const result = await getDb().execute({
    sql: `SELECT * FROM exercises WHERE cohort_id = ? AND is_active = 1 ORDER BY created_at ASC`,
    args: [cohortId],
  });
  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      cohortId: String(r.cohort_id),
      title: String(r.title),
      slug: String(r.slug),
      description: r.description ? String(r.description) : null,
      expected: {
        ...emptyExpected(),
        ...(JSON.parse(String(r.expected_json)) as ExpectedCriteria),
      },
      isActive: Boolean(r.is_active),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  });
}

export async function getCohortDashboard(cohortId: string): Promise<CohortDashboard | null> {
  const cohort = await getCohort(cohortId);
  if (!cohort) return null;

  const students = await listStudents(cohortId);
  const exercises = await listExercises(cohortId);
  const db = getDb();

  const submissionsResult = await db.execute({
    sql: `SELECT * FROM submissions WHERE cohort_id = ?`,
    args: [cohortId],
  });

  type SubRow = Record<string, unknown>;
  const submissions = submissionsResult.rows as SubRow[];

  const metricsBySubmission = new Map<
    string,
    { scoreRatio: number; currentVersion: number; updatedAt: string }
  >();

  for (const sub of submissions) {
    const subId = String(sub.id);
    const latest = await db.execute({
      sql: `
        SELECT score_ratio, share_version, captured_at
        FROM submission_versions
        WHERE submission_id = ?
        ORDER BY share_version DESC
        LIMIT 1
      `,
      args: [subId],
    });
    const m = latest.rows[0] as SubRow | undefined;
    metricsBySubmission.set(subId, {
      scoreRatio: m ? Number(m.score_ratio) : 0,
      currentVersion: m ? Number(m.share_version) : Number(sub.current_version),
      updatedAt: String(sub.updated_at),
    });
  }

  const subIndex = new Map<string, SubRow>();
  for (const sub of submissions) {
    subIndex.set(`${sub.student_id}:${sub.exercise_id}`, sub);
  }

  const rows: DashboardStudentRow[] = students.map((student) => {
    const cells: DashboardExerciseCell[] = exercises.map((exercise) => {
      const sub = subIndex.get(`${student.id}:${exercise.id}`);
      if (!sub) {
        return {
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          status: "missing",
          currentVersion: 0,
          scoreRatio: 0,
          shareId: null,
        };
      }

      const metrics = metricsBySubmission.get(String(sub.id));
      const isValidated = Boolean(sub.is_validated);
      const currentVersion = metrics?.currentVersion ?? Number(sub.current_version);
      const scoreRatio = metrics?.scoreRatio ?? 0;

      let status: DashboardExerciseCell["status"] = "in_progress";
      if (isValidated) status = "ok";
      else if (currentVersion >= 3) status = "ko";

      return {
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        status,
        currentVersion,
        scoreRatio,
        shareId: String(sub.share_id),
      };
    });

    const validatedCount = cells.filter((c) => c.status === "ok").length;
    const overallScore =
      cells.length === 0
        ? 0
        : Math.round(
            (cells.reduce((sum, c) => sum + c.scoreRatio, 0) / cells.length) * 100,
          ) / 100;

    const relatedSubs = submissions.filter((s) => String(s.student_id) === student.id);
    const lastActivity =
      relatedSubs.length === 0
        ? null
        : relatedSubs
            .map((s) => String(s.updated_at))
            .sort()
            .reverse()[0];

    return {
      studentId: student.id,
      displayName: student.displayName,
      overallScore,
      validatedCount,
      exerciseCount: exercises.length,
      lastActivity,
      cells,
    };
  });

  const totalCells = rows.length * Math.max(1, exercises.length);
  const validatedCells = rows.reduce(
    (sum, row) => sum + row.cells.filter((c) => c.status === "ok").length,
    0,
  );
  const blockedCount = rows.reduce(
    (sum, row) => sum + row.cells.filter((c) => c.status === "ko").length,
    0,
  );

  return {
    cohort,
    exercises,
    students: rows,
    stats: {
      studentCount: students.length,
      exerciseCount: exercises.length,
      validationRate:
        totalCells === 0 ? 0 : Math.round((validatedCells / totalCells) * 1000) / 10,
      blockedCount,
    },
  };
}

export async function getStudentProgress(
  studentId: string,
): Promise<StudentProgress | null> {
  await ensureSchema();
  const db = getDb();
  const studentResult = await db.execute({
    sql: `SELECT * FROM students WHERE id = ? LIMIT 1`,
    args: [studentId],
  });
  const sr = studentResult.rows[0] as Record<string, unknown> | undefined;
  if (!sr) return null;

  const student: Student = {
    id: String(sr.id),
    cohortId: String(sr.cohort_id),
    displayName: String(sr.display_name),
    email: sr.email ? String(sr.email) : null,
    externalRef: sr.external_ref ? String(sr.external_ref) : null,
    status: String(sr.status) as Student["status"],
    createdAt: String(sr.created_at),
    updatedAt: String(sr.updated_at),
  };

  const cohort = await getCohort(student.cohortId);
  if (!cohort) return null;

  const subs = await db.execute({
    sql: `SELECT * FROM submissions WHERE student_id = ? ORDER BY updated_at DESC`,
    args: [studentId],
  });

  const submissions = [];
  for (const row of subs.rows as Record<string, unknown>[]) {
    const exerciseResult = await db.execute({
      sql: `SELECT * FROM exercises WHERE id = ? LIMIT 1`,
      args: [String(row.exercise_id)],
    });
    const er = exerciseResult.rows[0] as Record<string, unknown> | undefined;
    if (!er) continue;

    const versionsResult = await db.execute({
      sql: `
        SELECT * FROM submission_versions
        WHERE submission_id = ?
        ORDER BY share_version ASC
      `,
      args: [String(row.id)],
    });

    const versions = versionsResult.rows.map((v) => {
      const r = v as Record<string, unknown>;
      return {
        id: String(r.id),
        submissionId: String(r.submission_id),
        shareVersion: Number(r.share_version),
        scoreOk: Number(r.score_ok),
        scoreWarn: Number(r.score_warn),
        scoreFail: Number(r.score_fail),
        scoreRatio: Number(r.score_ratio),
        reworkedAfterFeedback: Boolean(r.reworked_after_feedback),
        capturedAt: String(r.captured_at),
        note: r.note ? String(r.note) : null,
      };
    });

    submissions.push({
      submission: {
        id: String(row.id),
        shareId: String(row.share_id),
        cohortId: String(row.cohort_id),
        studentId: String(row.student_id),
        exerciseId: String(row.exercise_id),
        currentVersion: Number(row.current_version),
        isValidated: Boolean(row.is_validated),
        validatedAt: row.validated_at ? String(row.validated_at) : null,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      },
      exercise: {
        id: String(er.id),
        cohortId: String(er.cohort_id),
        title: String(er.title),
        slug: String(er.slug),
        description: er.description ? String(er.description) : null,
        expected: {
          ...emptyExpected(),
          ...(JSON.parse(String(er.expected_json)) as ExpectedCriteria),
        },
        isActive: Boolean(er.is_active),
        createdAt: String(er.created_at),
        updatedAt: String(er.updated_at),
      },
      shareId: String(row.share_id),
      versions,
      latestScoreRatio: versions.length
        ? versions[versions.length - 1].scoreRatio
        : 0,
    });
  }

  const validatedCount = submissions.filter((s) => s.submission.isValidated).length;
  const avgScoreRatio =
    submissions.length === 0
      ? 0
      : Math.round(
          (submissions.reduce((sum, s) => sum + s.latestScoreRatio, 0) /
            submissions.length) *
            100,
        ) / 100;

  const reworkCount = submissions.reduce(
    (sum, s) => sum + s.versions.filter((v) => v.reworkedAfterFeedback).length,
    0,
  );
  const versionCount = submissions.reduce((sum, s) => sum + s.versions.length, 0);

  const submissionByExercise = new Map(
    submissions.map((s) => [s.exercise.id, s]),
  );
  const allExercises = await listExercises(student.cohortId);
  const exerciseSlots: ExerciseSlot[] = [];

  for (const exercise of allExercises) {
    const linked = submissionByExercise.get(exercise.id);
    const submission = linked?.submission ?? null;
    const shareId = linked?.shareId ?? null;
    let editLink: string | null = null;

    if (shareId) {
      const share = await getShare(shareId);
      if (share) {
        editLink = `/e/${shareId}?token=${share.editToken}`;
      }
    }

    exerciseSlots.push({
      exercise,
      submission,
      shareId,
      renderLink: buildRenderLink({
        cohortId: student.cohortId,
        studentId: student.id,
        exerciseId: exercise.id,
      }),
      editLink,
    });
  }

  const pendingCount = exerciseSlots.filter((slot) => !slot.submission).length;

  return {
    student,
    cohort,
    submissions,
    exerciseSlots,
    stats: {
      totalSubmissions: submissions.length,
      validatedCount,
      avgScoreRatio,
      reworkRate:
        versionCount === 0 ? 0 : Math.round((reworkCount / versionCount) * 1000) / 10,
      pendingCount,
    },
  };
}

export async function seedDemoCohort(): Promise<{
  cohort: Cohort;
  students: Student[];
  exercises: Exercise[];
  dashboardUrl: string;
}> {
  const cohort = await createCohort({
    name: "OC JS React — Juin 2026 (démo)",
    code: "JS-2026-06",
  });

  const exercises = await Promise.all([
    addExercise({
      cohortId: cohort.id,
      title: "POST /login",
      slug: "post-login",
      expected: {
        method: "POST",
        urlIncludes: "/login",
        requiredHeaders: ["Content-Type"],
        expectedStatus: 200,
        requireAuthorization: true,
        requireJsonBody: true,
      },
    }),
    addExercise({
      cohortId: cohort.id,
      title: "GET /users",
      slug: "get-users",
      expected: {
        method: "GET",
        urlIncludes: "/users",
        requiredHeaders: ["Authorization"],
        expectedStatus: 200,
        requireAuthorization: true,
        requireJsonBody: false,
      },
    }),
  ]);

  const students = await Promise.all([
    addStudent({ cohortId: cohort.id, displayName: "Léa", externalRef: "lea" }),
    addStudent({ cohortId: cohort.id, displayName: "Walid", externalRef: "walid" }),
    addStudent({ cohortId: cohort.id, displayName: "Aurore", externalRef: "aurore" }),
  ]);

  return {
    cohort,
    students: students.filter(Boolean) as Student[],
    exercises: exercises.filter(Boolean) as Exercise[],
    dashboardUrl: `/dashboard/${cohort.id}`,
  };
}
