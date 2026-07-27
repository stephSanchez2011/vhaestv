import { NextResponse } from "next/server";
import { createShare, toPublicShare } from "@/lib/store";
import type { ExpectedCriteria, RequestSnapshot } from "@/lib/types";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isSnapshot(body.snapshot)) {
      return NextResponse.json(
        { error: "Snapshot de requête invalide." },
        { status: 400 },
      );
    }

    const expected = body.expected as ExpectedCriteria | undefined;
    const { share, editToken, trainerToken } = await createShare({
      title: String(body.title ?? "Requête API"),
      studentLabel: String(body.studentLabel ?? "Apprenant"),
      snapshot: body.snapshot,
      expected,
    });

    return NextResponse.json({
      id: share.id,
      editToken,
      trainerToken,
      share: toPublicShare(share),
      shareUrl: `/s/${share.id}`,
      editUrl: `/e/${share.id}?token=${editToken}`,
      trainerUrl: `/s/${share.id}?t=${trainerToken}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de créer le partage." },
      { status: 500 },
    );
  }
}
