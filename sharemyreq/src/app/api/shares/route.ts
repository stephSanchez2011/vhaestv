import { NextResponse } from "next/server";
import { createShare, toPublicShare } from "@/lib/store";
import { linkShareToSubmission } from "@/lib/v2-store";
import type { ExpectedCriteria, RequestSnapshot } from "@/lib/types";

export const runtime = "nodejs";

function isSnapshot(value: unknown): value is RequestSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.method === "string" &&
    typeof v.url === "string" &&
    typeof v.requestBody === "string" &&
    typeof v.responseBody === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isSnapshot(body.snapshot)) {
      return NextResponse.json(
        { error: "Snapshot de requête invalide." },
        { status: 400 },
      );
    }

    const expected = body.expected as ExpectedCriteria | undefined;
    const cohortId = body.cohortId ? String(body.cohortId).trim() : "";
    const studentId = body.studentId ? String(body.studentId).trim() : "";
    const exerciseId = body.exerciseId ? String(body.exerciseId).trim() : "";
    const hasLinkContext = Boolean(cohortId && studentId && exerciseId);

    const { share, editToken, trainerToken } = await createShare({
      title: String(body.title ?? "Requête API"),
      studentLabel: String(body.studentLabel ?? "Apprenant"),
      snapshot: body.snapshot,
      expected,
    });

    let linked = false;
    if (hasLinkContext) {
      const submission = await linkShareToSubmission({
        shareId: share.id,
        cohortId,
        studentId,
        exerciseId,
      });
      linked = Boolean(submission);
    }

    return NextResponse.json({
      id: share.id,
      editToken,
      trainerToken,
      share: toPublicShare(share),
      shareUrl: `/s/${share.id}`,
      editUrl: `/e/${share.id}?token=${editToken}`,
      trainerUrl: `/s/${share.id}?t=${trainerToken}`,
      linked,
      dashboardUrl: linked && cohortId ? `/dashboard/${cohortId}` : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de créer le partage." },
      { status: 500 },
    );
  }
}
