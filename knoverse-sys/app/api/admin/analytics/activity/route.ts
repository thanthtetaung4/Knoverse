import { checkAuth } from "@/lib/auth/checkAuth";
import { NextRequest, NextResponse } from "next/server";
import { analyticsEvents, teams } from "@/db/schema";
import { db } from "@/db";
import checkUserRole from "@/lib/checkUserRole";
import { count, desc, eq } from "drizzle-orm";

/*
 * Return the analytics activity data for admin dashboard
 *
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

  console.log(accessToken);
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
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data", details: String(error) },
      { status: 500 }
    );
  }
}
