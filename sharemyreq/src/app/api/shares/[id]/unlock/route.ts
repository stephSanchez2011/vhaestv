import { NextResponse } from "next/server";
import { assertTrainerAccess, getShare } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const trainerToken = String(body.trainerToken ?? "");
    const share = await getShare(id);
    if (!share) {
      return NextResponse.json(
        { error: "Partage introuvable ou expiré." },
        { status: 404 },
      );
    }
    if (!assertTrainerAccess(share, trainerToken)) {
      return NextResponse.json(
        { error: "Token formateur invalide." },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur d’auth." }, { status: 500 });
  }
}
