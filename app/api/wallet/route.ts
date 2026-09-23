import { NextRequest, NextResponse } from "next/server";
import { getWalletPortfolio } from "@/lib/solana/connection";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { ok: false, error: "MISSING_ADDRESS", fetchedAt: new Date().toISOString(), source: "Solana RPC" },
      { status: 400 },
    );
  }
  const result = await getWalletPortfolio(address);
  return NextResponse.json(result);
}
