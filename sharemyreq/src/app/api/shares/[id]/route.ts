import { NextResponse } from "next/server";
import {
  addVersion,
  assertEditorAccess,
  getShare,
  toPublicShare,
} from "@/lib/store";
import type { RequestSnapshot } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) {
    return NextResponse.json(
      { error: "Partage introuvable ou expiré." },
      { status: 404 },
    );
  }

  const editToken = new URL(request.url).searchParams.get("editToken");
  if (editToken && assertEditorAccess(share, editToken)) {
    return NextResponse.json({
      share: toPublicShare(share),
      editToken: share.editToken,
      trainerToken: share.trainerToken,
      trainerUrl: `/s/${share.id}?t=${share.trainerToken}`,
      editUrl: `/e/${share.id}?token=${share.editToken}`,
      captureUrl: `/api/shares/${share.id}/inbox?token=${share.editToken}`,
    });
  }

  return NextResponse.json({ share: toPublicShare(share) });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const body = await request.json();
    const editToken = String(body.editToken ?? "");
    if (!editToken) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }
    if (!isSnapshot(body.snapshot)) {
      return NextResponse.json(
        { error: "Snapshot de requête invalide." },
        { status: 400 },
      );
    }

    const share = await addVersion(id, editToken, body.snapshot, {
      afterFeedback: Boolean(body.afterFeedback),
      note: typeof body.note === "string" ? body.note : undefined,
    });

    if (!share) {
      return NextResponse.json(
        { error: "Mise à jour impossible (token, id ou expiration)." },
        { status: 403 },
      );
    }

    return NextResponse.json({ share: toPublicShare(share) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour." },
      { status: 500 },
    );
  }
}
