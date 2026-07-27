import { NextResponse } from "next/server";
import { addVersion, getShare, toPublicShare } from "@/lib/store";
import type { HttpMethod, RequestSnapshot } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

function headersFromRequest(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() === "host") return;
    if (key.toLowerCase() === "cookie") return;
    headers[key] = value;
  });
  return headers;
}

async function capture(request: Request, id: string, editToken: string) {
  const share = await getShare(id);
  if (!share) {
    return NextResponse.json(
      { error: "Partage introuvable ou expiré." },
      { status: 404 },
    );
  }

  const method = request.method.toUpperCase();
  const bodyText = ["GET", "HEAD"].includes(method)
    ? ""
    : await request.text();

  const url = new URL(request.url);
  const targetHint =
    request.headers.get("x-original-url") ||
    url.searchParams.get("url") ||
    `${url.origin}/api/shares/${id}/inbox`;

  const snapshot: RequestSnapshot = {
    method: (METHODS.has(method) ? method : "POST") as HttpMethod,
    url: targetHint,
    status: 200,
    statusText: "Captured",
    durationMs: null,
    requestHeaders: headersFromRequest(request),
    responseHeaders: { "content-type": "application/json" },
    requestBody: bodyText,
    responseBody: JSON.stringify(
      {
        ok: true,
        message: "Requête capturée par ShareMyReq inbox",
        shareId: id,
      },
      null,
      2,
    ),
    note: "Capturé via inbox mock",
  };

  const updated = await addVersion(id, editToken, snapshot, {
    afterFeedback: share.feedback.length > 0,
    note: snapshot.note,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Token d’édition invalide." },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      version: updated.versions.length,
      share: toPublicShare(updated),
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
    },
  );
}

async function handle(request: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);
  const editToken =
    url.searchParams.get("token") ||
    request.headers.get("x-edit-token") ||
    "";

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
    });
  }

  if (!editToken) {
    return NextResponse.json(
      { error: "token manquant (?token=...)" },
      { status: 401 },
    );
  }

  return capture(request, id, editToken);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
