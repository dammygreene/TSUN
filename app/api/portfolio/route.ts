import { NextResponse } from "next/server";
import { getTSUNPortfolio } from "@/lib/portfolio/simulated";

export async function GET() {
  const result = await getTSUNPortfolio();
  return NextResponse.json(result);
}
