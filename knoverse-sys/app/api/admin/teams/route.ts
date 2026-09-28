import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { HttpError, parseJson, withAuth } from "@/lib/api/handler";
import { deleteAllTeamFiles } from "@/lib/files";

const createSchema = z.object({
  teamName: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
});

const deleteSchema = z.object({ teamId: z.uuid() });

export const POST = withAuth(
  async (request) => {
    const { teamName, description } = await parseJson(request, createSchema);

    const existing = await db.select({ id: teams.id }).from(teams).where(eq(teams.name, teamName)).limit(1);
    if (existing.length > 0) throw new HttpError(409, "A team with this name already exists");

    const [team] = await db.insert(teams).values({ name: teamName, description }).returning();
    return NextResponse.json({ message: "Team created successfully", team });
  },
  { admin: true }
);

export const DELETE = withAuth(
  async (request) => {
    const { teamId } = await parseJson(request, deleteSchema);

    // Remove every file (vectors, storage object, row) first. If any file fails,
    // the team is kept so the delete can be retried without orphaning data.
    await deleteAllTeamFiles(teamId);

    // Members, chat sessions/messages and analytics rows cascade from teams.
    const deleted = await db.delete(teams).where(eq(teams.id, teamId)).returning({ id: teams.id });
    if (deleted.length === 0) throw new HttpError(404, "Team not found");

    return NextResponse.json({ message: "Team deleted successfully" });
  },
  { admin: true }
);

export const GET = withAuth(
  async () => {
    const teamsList = await db.select().from(teams);
    return NextResponse.json({ teams: teamsList });
  },
  { admin: true }
);
