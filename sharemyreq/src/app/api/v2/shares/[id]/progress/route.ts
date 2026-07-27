import { NextResponse } from "next/server";
import { getShareProgressContext } from "@/lib/v2-store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const context = await getShareProgressContext(id);
    if (!context) {
      return NextResponse.json({ linked: false, context: null });
    }
    return NextResponse.json({ linked: true, context });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de charger la progression liée." },
      { status: 500 },
    );
  }
}
