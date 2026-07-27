import { NextResponse } from "next/server";
import { createShare } from "@/lib/store";
import { linkShareToSubmission, seedDemoCohort } from "@/lib/v2-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const seeded = await seedDemoCohort();
    const lea = seeded.students.find((s) => s.externalRef === "lea");
    const exercise = seeded.exercises[0];
    if (!lea || !exercise) {
      return NextResponse.json({ error: "Seed incomplet." }, { status: 500 });
    }

    const { share, editToken, trainerToken } = await createShare({
      title: exercise.title,
      studentLabel: lea.displayName,
      ttlHours: 168,
      expected: exercise.expected,
      snapshot: {
        method: "POST",
        url: "https://api.example.com/api/login",
        status: 401,
        statusText: "Unauthorized",
        durationMs: 112,
        requestHeaders: { "Content-Type": "application/json" },
        responseHeaders: { "content-type": "application/json" },
        requestBody: JSON.stringify({ email: "lea@mail.com" }, null, 2),
        responseBody: JSON.stringify({ error: "missing token" }, null, 2),
        note: "Premier rendu",
      },
    });

    await linkShareToSubmission({
      shareId: share.id,
      cohortId: seeded.cohort.id,
      studentId: lea.id,
      exerciseId: exercise.id,
    });

    return NextResponse.json({
      cohort: seeded.cohort,
      students: seeded.students,
      exercises: seeded.exercises,
      sampleShare: {
        shareId: share.id,
        editToken,
        trainerToken,
        shareUrl: `/s/${share.id}?t=${trainerToken}`,
      },
      dashboardUrl: `/dashboard/${seeded.cohort.id}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Seed V2 impossible." }, { status: 500 });
  }
}
