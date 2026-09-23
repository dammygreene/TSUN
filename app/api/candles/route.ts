import { NextRequest, NextResponse } from "next/server";
import { getCandles, type CandleRange } from "@/lib/market/providers";

const VALID: CandleRange[] = ["1H", "4H", "1D", "1W", "ALL"];

export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get("range") ?? "1D") as CandleRange;
  if (!VALID.includes(range)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_RANGE", fetchedAt: new Date().toISOString(), source: "GeckoTerminal" },
      { status: 400 },
    );
  }
  const result = await getCandles(range);
  return NextResponse.json(result);
}
