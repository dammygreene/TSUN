import { NextResponse } from "next/server";
import { MILESTONE_DEFS } from "@/lib/milestones/registry";

// Milestone definitions. Unlock state lives client side for the MVP
// (localStorage) and moves to Postgres per schema.sql in production.
export async function GET() {
  return NextResponse.json({ milestones: MILESTONE_DEFS });
}
