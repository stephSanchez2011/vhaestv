import { NextResponse } from "next/server";
import { createCohort, listCohorts } from "@/lib/v2-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cohorts = await listCohorts();
    return NextResponse.json({ cohorts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de lister les promos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Nom de promo requis." }, { status: 400 });
    }

    const cohort = await createCohort({
      name,
      code: body.code ? String(body.code) : undefined,
      schoolName: body.schoolName ? String(body.schoolName) : undefined,
    });

    return NextResponse.json({
      cohort,
      dashboardUrl: `/dashboard/${cohort.id}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de créer la promo." }, { status: 500 });
  }
}
