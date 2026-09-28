import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { withAuth } from "@/lib/api/handler";

export const GET = withAuth(
  async () => {
    const [result] = await db.select({ totalTeams: count(teams.id) }).from(teams);
    return NextResponse.json({ numberOfTeams: result.totalTeams });
  },
  { admin: true }
);
