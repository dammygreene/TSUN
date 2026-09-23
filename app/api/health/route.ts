import { NextResponse } from "next/server";
import { getMarketOverview } from "@/lib/market/providers";
import { getConnection } from "@/lib/solana/connection";
import type { DataState } from "@/types/tsun";

function timeout<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function GET() {
  const marketPromise = getMarketOverview()
    .then((r): DataState => (r.ok ? (r.stale ? "stale" : "loaded") : "error"))
    .catch((): DataState => "error");
  const rpcPromise = getConnection()
    .getSlot()
    .then((): DataState => "loaded")
    .catch((): DataState => "error");

  const [market, rpc] = await Promise.all([
    Promise.race([marketPromise, timeout(3500, "error" as DataState)]),
    Promise.race([rpcPromise, timeout(3500, "error" as DataState)]),
  ]);
  return NextResponse.json({ market, rpc });
}
