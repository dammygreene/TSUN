import { NextRequest, NextResponse } from "next/server";
import { getStagingFeed, X_TABS } from "@/lib/x/feed";

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab");
  const valid = tab && (X_TABS as readonly string[]).includes(tab);
  const posts = getStagingFeed(valid ? (tab as (typeof X_TABS)[number]) : "ALL");
  return NextResponse.json({ staging: true, posts });
}
