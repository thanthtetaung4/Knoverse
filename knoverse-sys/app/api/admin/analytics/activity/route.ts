import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, teams } from "@/db/schema";
import { withAuth } from "@/lib/api/handler";

/*
 * Return the analytics activity data for admin dashboard
 */
export const GET = withAuth(
  async () => {
    // Get top 5 teams by number of analytics events with team names
    const topTeams = await db
      .select({
        teamId: analyticsEvents.teamId,
        teamName: teams.name,
        eventCount: count(analyticsEvents.id),
      })
      .from(analyticsEvents)
      .leftJoin(teams, eq(analyticsEvents.teamId, teams.id))
      .groupBy(analyticsEvents.teamId, teams.name)
      .orderBy(desc(count(analyticsEvents.id)))
      .limit(5);

    return NextResponse.json({ topTeams });
  },
  { admin: true }
);
