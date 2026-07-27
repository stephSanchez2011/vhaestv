import { NextResponse } from "next/server";
import { addExercise } from "@/lib/v2-store";
import type { ExpectedCriteria } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Titre exercice requis." }, { status: 400 });
    }

    const exercise = await addExercise({
      cohortId: id,
      title,
      slug: body.slug ? String(body.slug) : undefined,
      description: body.description ? String(body.description) : undefined,
      expected: body.expected as ExpectedCriteria | undefined,
    });

    if (!exercise) {
      return NextResponse.json({ error: "Promo introuvable." }, { status: 404 });
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d'ajouter l'exercice." },
      { status: 500 },
    );
  }
}
