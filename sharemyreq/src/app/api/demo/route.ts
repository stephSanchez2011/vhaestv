import { NextResponse } from "next/server";
import {
  addFeedback,
  addVersion,
  createShare,
  toPublicShare,
  updateExpected,
} from "@/lib/store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { share, editToken } = await createShare({
      title: "POST /api/login — démo formation",
      studentLabel: "Léa (démo)",
      ttlHours: 168,
      expected: {
        method: "POST",
        urlIncludes: "/api/login",
        requiredHeaders: ["Content-Type", "Accept"],
        expectedStatus: 200,
        requireAuthorization: true,
        requireJsonBody: true,
      },
      snapshot: {
        method: "POST",
        url: "https://api.example.com/api/login",
        status: 401,
        statusText: "Unauthorized",
        durationMs: 112,
        requestHeaders: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        responseHeaders: {
          "content-type": "application/json",
        },
        requestBody: JSON.stringify(
          { email: "lea@mail.com", password: "secret" },
          null,
          2,
        ),
        responseBody: JSON.stringify({ error: "missing token" }, null, 2),
        note: "Premier envoi — j’ai oublié le token",
      },
    });

    await addFeedback(share.id, {
      authorLabel: "Formateur",
      message:
        "Presque. Il manque Authorization: Bearer … et on vise un 200 une fois le token présent.",
    });

    const updated = await addVersion(
      share.id,
      editToken,
      {
        method: "POST",
        url: "https://api.example.com/api/login",
        status: 200,
        statusText: "OK",
        durationMs: 84,
        requestHeaders: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo",
        },
        responseHeaders: {
          "content-type": "application/json",
        },
        requestBody: JSON.stringify(
          { email: "lea@mail.com", password: "secret" },
          null,
          2,
        ),
        responseBody: JSON.stringify({ token: "ok", userId: 42 }, null, 2),
        note: "Bearer ajouté après retex",
      },
      { afterFeedback: true },
    );

    // ensure expected stays (createShare already set it; updateExpected noop-safe)
    const finalShare = updated
      ? await updateExpected(share.id, share.expected)
      : share;

    return NextResponse.json({
      id: share.id,
      editToken,
      share: toPublicShare(finalShare || share),
      shareUrl: `/s/${share.id}`,
      editUrl: `/e/${share.id}?token=${editToken}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de créer la démo." },
      { status: 500 },
    );
  }
}
