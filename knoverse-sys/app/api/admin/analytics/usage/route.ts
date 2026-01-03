import { checkAuth } from "@/lib/auth/checkAuth";
import { NextRequest, NextResponse } from "next/server";
import { analyticsEvents, teams, teamMembers } from "@/db/schema";
import { db } from "@/db";
import checkUserRole from "@/lib/checkUserRole";
import { count, desc, eq } from "drizzle-orm";

/*
 * Return the analytics usage data for admin dashboard
 * - number of users per team (from team_members)
 * - number of activities per team (from analytics_events)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  // Check authentication
  const authResult = await checkAuth(accessToken);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const isAdmin: boolean = await checkUserRole(authResult.user);
  if (!isAdmin) {
    return NextResponse.json({ error: "Not Allowed" }, { status: 405 });
  }

  try {
    // Users per team
    const usersByTeam = await db
      .select({
        teamId: teamMembers.teamId,
        teamName: teams.name,
        userCount: count(teamMembers.userId),
      })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .groupBy(teamMembers.teamId, teams.name);

    // Activities per team
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
    const statsMap = new Map<
      string,
      {
        teamName: string | null;
        userCount: number;
        activityCount: number;
      }
    >();

    usersByTeam.forEach((r: any) => {
      const id = r.teamId ?? null;
      statsMap.set(id, {
        teamName: r.teamName ?? null,
        userCount: Number(r.userCount ?? 0),
        activityCount: 0,
      });
    });

    activitiesByTeam.forEach((r: any) => {
      const id = r.teamId ?? null;
      const existing = statsMap.get(id);
      if (existing) {
        existing.activityCount = Number(r.activityCount ?? 0);
      } else {
        statsMap.set(id, {
          teamName: r.teamName ?? null,
          userCount: 0,
          activityCount: Number(r.activityCount ?? 0),
        });
      }
    });

    const teamStats = Array.from(statsMap.values()).sort(
      (a, b) => b.activityCount - a.activityCount
    );

    return NextResponse.json({ teamStats });
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data", details: String(error) },
      { status: 500 }
    );
  }
}
