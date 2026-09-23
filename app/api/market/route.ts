import { NextResponse } from "next/server";
import { getMarketOverview } from "@/lib/market/providers";

export async function GET() {
  const market = await getMarketOverview();
  return NextResponse.json({ market });
}
