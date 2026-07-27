import { NextResponse } from "next/server";
import { addStudent, listStudents } from "@/lib/v2-store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const students = await listStudents(id);
    return NextResponse.json({ students });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de lister les élèves." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const displayName = String(body.displayName ?? "").trim();
    if (!displayName) {
      return NextResponse.json({ error: "Nom élève requis." }, { status: 400 });
    }

    const student = await addStudent({
      cohortId: id,
      displayName,
      email: body.email ? String(body.email) : undefined,
      externalRef: body.externalRef ? String(body.externalRef) : undefined,
    });

    if (!student) {
      return NextResponse.json({ error: "Promo introuvable." }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible d'ajouter l'élève." }, { status: 500 });
  }
}
