import { NextResponse } from "next/server";
import { linkShareToSubmission } from "@/lib/v2-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shareId = String(body.shareId ?? "").trim();
    const cohortId = String(body.cohortId ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();
    const exerciseId = String(body.exerciseId ?? "").trim();

    if (!shareId || !cohortId || !studentId || !exerciseId) {
      return NextResponse.json(
        { error: "shareId, cohortId, studentId et exerciseId requis." },
        { status: 400 },
      );
    }

    const submission = await linkShareToSubmission({
      shareId,
      cohortId,
      studentId,
      exerciseId,
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Lien impossible (share/promo/élève/exercice)." },
        { status: 404 },
      );
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de lier le share." }, { status: 500 });
  }
}
