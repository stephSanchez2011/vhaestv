import type { ExpectedCriteria } from "./types";

export type School = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type Cohort = {
  id: string;
  schoolId: string;
  name: string;
  code: string | null;
  startDate: string | null;
  endDate: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type Student = {
  id: string;
  cohortId: string;
  displayName: string;
  email: string | null;
  externalRef: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type Exercise = {
  id: string;
  cohortId: string;
  title: string;
  slug: string;
  description: string | null;
  expected: ExpectedCriteria;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Submission = {
  id: string;
  shareId: string;
  cohortId: string;
  studentId: string;
  exerciseId: string;
  currentVersion: number;
  isValidated: boolean;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionVersionMetrics = {
  id: string;
  submissionId: string;
  shareVersion: number;
  scoreOk: number;
  scoreWarn: number;
  scoreFail: number;
  scoreRatio: number;
  reworkedAfterFeedback: boolean;
  capturedAt: string;
  note: string | null;
};

export type DashboardExerciseCell = {
  exerciseId: string;
  exerciseTitle: string;
  status: "ok" | "ko" | "in_progress" | "missing";
  currentVersion: number;
  scoreRatio: number;
  shareId: string | null;
};

export type DashboardStudentRow = {
  studentId: string;
  displayName: string;
  overallScore: number;
  validatedCount: number;
  exerciseCount: number;
  lastActivity: string | null;
  cells: DashboardExerciseCell[];
};

export type CohortDashboard = {
  cohort: Cohort;
  exercises: Exercise[];
  students: DashboardStudentRow[];
  stats: {
    studentCount: number;
    exerciseCount: number;
    validationRate: number;
    blockedCount: number;
  };
};

export type ExerciseSlot = {
  exercise: Exercise;
  submission: Submission | null;
  shareId: string | null;
  renderLink: string;
  editLink: string | null;
};

export type RenderContext = {
  cohort: Cohort;
  student: Student;
  exercise: Exercise;
  existingSubmission: {
    shareId: string;
    editLink: string;
    shareLink: string;
  } | null;
};

export type StudentProgress = {
  student: Student;
  cohort: Cohort;
  submissions: Array<{
    submission: Submission;
    exercise: Exercise;
    shareId: string;
    versions: SubmissionVersionMetrics[];
    latestScoreRatio: number;
  }>;
  exerciseSlots: ExerciseSlot[];
  stats: {
    totalSubmissions: number;
    validatedCount: number;
    avgScoreRatio: number;
    reworkRate: number;
    pendingCount: number;
  };
};
