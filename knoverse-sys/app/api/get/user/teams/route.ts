import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { teamMembers, teams } from "@/db/schema";
import { jsonError, parseQuery, withAuth } from "@/lib/api/handler";

const querySchema = z.object({ userId: z.uuid() });

/** Teams a user belongs to. Users may look up themselves; admins anyone. */
export const GET = withAuth(async (request, { user }) => {
  const { userId } = parseQuery(request, querySchema);
  if (userId !== user.id && user.role !== "admin") {
    return jsonError("Forbidden", 403);
  }

  const rows = await db
    .select({ team: teams })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId));

  return NextResponse.json({ teams: rows.map((r) => r.team) });
});
