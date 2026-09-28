import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, teamMembers, teams } from "@/db/schema";
import { withAuth } from "@/lib/api/handler";

type TeamStats = {
  teamName: string | null;
  userCount: number;
  activityCount: number;
};

/*
 * Return the analytics usage data for admin dashboard
 * - number of users per team (from team_members)
 * - number of activities per team (from analytics_events)
 */
export const GET = withAuth(
  async () => {
    const usersByTeam = await db
      .select({
        teamId: teamMembers.teamId,
        teamName: teams.name,
        userCount: count(teamMembers.userId),
      })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .groupBy(teamMembers.teamId, teams.name);

    const activitiesByTeam = await db
      .select({
        teamId: analyticsEvents.teamId,
        teamName: teams.name,
        activityCount: count(analyticsEvents.id),
      })
      .from(analyticsEvents)
      .leftJoin(teams, eq(analyticsEvents.teamId, teams.id))
      .groupBy(analyticsEvents.teamId, teams.name)
      .orderBy(desc(count(analyticsEvents.id)));

    // Merge results
    const statsMap = new Map<string, TeamStats>();

    for (const r of usersByTeam) {
      statsMap.set(r.teamId, {
        teamName: r.teamName ?? null,
        userCount: Number(r.userCount ?? 0),
        activityCount: 0,
      });
    }

    for (const r of activitiesByTeam) {
      const existing = statsMap.get(r.teamId);
      if (existing) {
        existing.activityCount = Number(r.activityCount ?? 0);
      } else {
        statsMap.set(r.teamId, {
          teamName: r.teamName ?? null,
          userCount: 0,
          activityCount: Number(r.activityCount ?? 0),
        });
      }
    }

    const teamStats = Array.from(statsMap.values()).sort((a, b) => b.activityCount - a.activityCount);

    return NextResponse.json({ teamStats });
  },
  { admin: true }
);
