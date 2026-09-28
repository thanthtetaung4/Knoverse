import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { parseQuery, withAuth } from "@/lib/api/handler";

const querySchema = z.object({ teamId: z.uuid() });

export const GET = withAuth(async (request, { user }) => {
  const { teamId } = parseQuery(request, querySchema);

  const session = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.teamId, teamId), eq(chatSessions.userId, user.id)))
    .orderBy(desc(chatSessions.lastUpdated));

  return NextResponse.json({ chatSession: session });
});
