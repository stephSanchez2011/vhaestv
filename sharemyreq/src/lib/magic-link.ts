export type RenderLinkParams = {
  cohortId: string;
  studentId: string;
  exerciseId: string;
};

export function buildRenderLink(params: RenderLinkParams): string {
  const q = new URLSearchParams({
    cohort: params.cohortId,
    student: params.studentId,
    exercise: params.exerciseId,
  });
  return `/new?${q.toString()}`;
}

export function buildRenderLinkAbsolute(
  params: RenderLinkParams,
  origin: string,
): string {
  return `${origin.replace(/\/$/, "")}${buildRenderLink(params)}`;
}
