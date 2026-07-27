import { NextResponse } from "next/server";
import { addVersion, toPublicShare } from "@/lib/store";
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

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const editToken = String(body.editToken ?? "");
    if (!editToken) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }
    if (!isSnapshot(body.snapshot)) {
      return NextResponse.json(
        { error: "Snapshot invalide." },
        { status: 400 },
      );
    }

    const share = await addVersion(id, editToken, body.snapshot, {
      afterFeedback: Boolean(body.afterFeedback),
      note:
        typeof body.note === "string"
          ? body.note
          : body.snapshot.note || "Capturé via snippet fetch",
    });

    if (!share) {
      return NextResponse.json(
        { error: "Capture refusée (token/id)." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { share: toPublicShare(share), version: share.versions.length },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur capture." }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
  });
}
