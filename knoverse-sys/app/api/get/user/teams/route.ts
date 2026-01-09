import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { checkAuth } from "@/lib/auth/checkAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Check authentication and get the Supabase user
  const authHeader = request.headers.get("Authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer (.+)$/);
  const accessToken = tokenMatch ? tokenMatch[1] : "";
  const params = request.nextUrl.searchParams;
  const userId = params.get("userId");

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Missing userId query parameter" }),
      { status: 400 }
    );
  }

  const authResult = await checkAuth(accessToken);
  if (!authResult.success) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: 401,
    });
  }

  if (!authResult.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    // get teamIds the user belongs to
    const teamIdRows = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    const teamIds = teamIdRows.map((r) => r.teamId);

    if (teamIds.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    // fetch full team details from `teams` table
    const teamsResponse = await db
      .select()
      .from(teams)
      .where(inArray(teams.id, teamIds));

    return NextResponse.json({ teams: teamsResponse });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
