import { NextResponse } from "next/server";
import { addFeedback, toPublicShare } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const body = await request.json();
    const trainerToken = String(body.trainerToken ?? "");
    const message = String(body.message ?? "").trim();
    if (!trainerToken) {
      return NextResponse.json(
        { error: "Token formateur manquant." },
        { status: 401 },
      );
    }
    if (!message) {
      return NextResponse.json(
        { error: "Le retour formateur est vide." },
        { status: 400 },
      );
    }

    const share = await addFeedback(
      id,
      {
        message,
        authorLabel: String(body.authorLabel ?? "Formateur"),
      },
      trainerToken,
    );

    if (!share) {
      return NextResponse.json(
        { error: "Accès formateur refusé ou partage introuvable." },
        { status: 403 },
      );
    }

    return NextResponse.json({ share: toPublicShare(share) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le retour." },
      { status: 500 },
    );
  }
}
