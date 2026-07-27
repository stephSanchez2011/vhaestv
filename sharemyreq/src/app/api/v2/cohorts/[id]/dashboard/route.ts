import { NextResponse } from "next/server";
import { getCohortDashboard } from "@/lib/v2-store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const dashboard = await getCohortDashboard(id);
    if (!dashboard) {
      return NextResponse.json({ error: "Promo introuvable." }, { status: 404 });
    }
    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de charger le dashboard." },
      { status: 500 },
    );
  }
}
