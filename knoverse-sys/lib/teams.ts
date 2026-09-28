import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { teamMembers, teams, type UserDB } from "@/db/schema";

export async function teamExists(teamId: string) {
  const rows = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId)).limit(1);
  return rows.length > 0;
}

export async function isTeamMember(userId: string, teamId: string) {
  const rows = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1);
  return rows.length > 0;
}

/** Admins can reach every team; everyone else only the teams they belong to. */
export async function canAccessTeam(user: UserDB, teamId: string) {
  return user.role === "admin" || isTeamMember(user.id, teamId);
}
