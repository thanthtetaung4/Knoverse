import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { objects, teamFiles } from "@/db/schema";
import { parseQuery, withAuth } from "@/lib/api/handler";

const querySchema = z.object({ teamId: z.uuid() });

export const GET = withAuth(
  async (request) => {
    const { teamId } = parseQuery(request, querySchema);

    // Join team_files with storage.objects to return friendly file data
    const rows = await db
      .select({ file: objects.name, id: objects.id, createdAt: objects.createdAt })
      .from(teamFiles)
      .innerJoin(objects, eq(objects.id, teamFiles.objectId))
      .where(eq(teamFiles.teamId, teamId));

    return NextResponse.json({ rows });
  },
  { admin: true }
);
