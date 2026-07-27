import { NextResponse } from "next/server";
import { getStudentProgress } from "@/lib/v2-store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const progress = await getStudentProgress(id);
    if (!progress) {
      return NextResponse.json({ error: "Élève introuvable." }, { status: 404 });
    }
    return NextResponse.json({ progress });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de charger la progression." },
      { status: 500 },
    );
  }
}
