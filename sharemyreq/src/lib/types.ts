export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export type HeaderMap = Record<string, string>;

export type RequestSnapshot = {
  method: HttpMethod;
  url: string;
  status: number | null;
  statusText: string;
  durationMs: number | null;
  requestHeaders: HeaderMap;
  responseHeaders: HeaderMap;
  requestBody: string;
  responseBody: string;
  note: string;
};

export type RequestVersion = {
  id: string;
  version: number;
  createdAt: string;
  afterFeedback: boolean;
  snapshot: RequestSnapshot;
};

export type FeedbackItem = {
  id: string;
  createdAt: string;
  authorLabel: string;
  message: string;
  targetVersion: number;
};

export type ExpectedCriteria = {
  method: HttpMethod | "";
  urlIncludes: string;
  requiredHeaders: string[];
  expectedStatus: number | null;
  requireAuthorization: boolean;
  requireJsonBody: boolean;
};

export type ShareRecord = {
  id: string;
  editToken: string;
  trainerToken: string;
  title: string;
  studentLabel: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  expected: ExpectedCriteria;
  versions: RequestVersion[];
  feedback: FeedbackItem[];
};

export type PublicShare = Omit<ShareRecord, "editToken" | "trainerToken">;

export type ChecklistItem = {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail" | "info";
  detail: string;
};

export type DiffChange = {
  path: string;
  before: string;
  after: string;
  kind: "added" | "removed" | "changed";
};

export type ExerciseTemplate = {
  id: string;
  label: string;
  description: string;
  title: string;
  expected: ExpectedCriteria;
  snapshot: RequestSnapshot;
};
