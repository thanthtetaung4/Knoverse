import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { teamMembers } from "@/db/schema";
import { HttpError, jsonError, parseJson, parseQuery, withAuth } from "@/lib/api/handler";

const memberSchema = z.object({ teamId: z.uuid(), memberId: z.uuid() });
const querySchema = z.object({ userId: z.uuid() });

export const POST = withAuth(
  async (request) => {
    const { teamId, memberId } = await parseJson(request, memberSchema);

    const inserted = await db
      .insert(teamMembers)
      .values({ teamId, userId: memberId })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json({
      message: inserted.length ? "Member added to team successfully" : "User is already a member of this team",
      data: inserted,
    });
  },
  { admin: true }
);

/** Teams a user belongs to. Users may look up themselves; admins anyone. */
export const GET = withAuth(async (request, { user }) => {
  const { userId } = parseQuery(request, querySchema);
  if (userId !== user.id && user.role !== "admin") {
    return jsonError("Forbidden", 403);
  }

  const team = await db
    .select({ id: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  return NextResponse.json({ teamId: team });
});

export const DELETE = withAuth(
  async (request) => {
    const { teamId, memberId } = await parseJson(request, memberSchema);

    const deleted = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, memberId)))
      .returning();
    if (deleted.length === 0) throw new HttpError(404, "No team member found to delete");

    return NextResponse.json({ message: "Team member deleted successfully" });
  },
  { admin: true }
);
