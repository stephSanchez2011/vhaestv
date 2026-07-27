import { NextResponse } from "next/server";
import { getRenderContext } from "@/lib/v2-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cohortId = url.searchParams.get("cohort")?.trim() || "";
    const studentId = url.searchParams.get("student")?.trim() || "";
    const exerciseId = url.searchParams.get("exercise")?.trim() || "";

    if (!cohortId || !studentId || !exerciseId) {
      return NextResponse.json(
        { error: "Paramètres cohort, student et exercise requis." },
        { status: 400 },
      );
    }

    const context = await getRenderContext({ cohortId, studentId, exerciseId });
    if (!context) {
      return NextResponse.json(
        { error: "Contexte introuvable ou incohérent." },
        { status: 404 },
      );
    }

    return NextResponse.json({ context });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de charger le contexte de rendu." },
      { status: 500 },
    );
  }
}
