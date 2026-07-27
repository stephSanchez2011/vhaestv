import { NextResponse } from "next/server";
import { emptyExpected } from "@/lib/checklist";
import { getShare, toPublicShare, updateExpected } from "@/lib/store";
import type { ExpectedCriteria, HttpMethod } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const METHODS = new Set([
  "",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

function parseExpected(raw: unknown): ExpectedCriteria | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const method = String(value.method ?? "");
  if (!METHODS.has(method)) return null;

  const statusRaw = value.expectedStatus;
  let expectedStatus: number | null = null;
  if (statusRaw !== null && statusRaw !== undefined && statusRaw !== "") {
    const n = Number(statusRaw);
    if (Number.isNaN(n)) return null;
    expectedStatus = n;
  }

  const requiredHeaders = Array.isArray(value.requiredHeaders)
    ? value.requiredHeaders.map((h) => String(h))
    : String(value.requiredHeadersText ?? "")
        .split(/[\n,]/)
        .map((h) => h.trim())
        .filter(Boolean);

  return {
    method: method as HttpMethod | "",
    urlIncludes: String(value.urlIncludes ?? ""),
    requiredHeaders,
    expectedStatus,
    requireAuthorization: Boolean(value.requireAuthorization),
    requireJsonBody: Boolean(value.requireJsonBody),
  };
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const trainerToken = String(body.trainerToken ?? "");
    if (!trainerToken) {
      return NextResponse.json(
        { error: "Token formateur manquant." },
        { status: 401 },
      );
    }
    const expected = parseExpected(body.expected ?? body) || emptyExpected();
    const share = await updateExpected(id, expected, trainerToken);
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
      { error: "Impossible d’enregistrer les critères." },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) {
    return NextResponse.json(
      { error: "Partage introuvable ou expiré." },
      { status: 404 },
    );
  }
  return NextResponse.json({ expected: share.expected });
}
