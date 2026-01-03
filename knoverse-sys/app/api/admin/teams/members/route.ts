import { NextResponse, NextRequest } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import checkUserRole from "@/lib/checkUserRole";
import { teamMembers } from "@/supabase/migrations/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  const { teamId, memberId } = await request.json();

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

  //if user is admin add the team member to the teamid
  if (!teamId || !memberId) {
    return NextResponse.json(
      { error: "Missing teamId or memberId" },
      { status: 400 }
    );
  }

  let res;
  try {
    res = await db.insert(teamMembers).values({
      teamId: teamId,
      userId: memberId,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Error adding member to team", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Member added to team successfully",
    data: res,
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

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

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  let team;
  try {
    team = await db
      .select({ id: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Error fetching team members", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ teamId: team });
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  const { teamId, memberId } = await request.json();

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

  if (!teamId || !memberId) {
    return NextResponse.json(
      { error: "Missing teamId or memberId" },
      { status: 400 }
    );
  }

  try {
    const result = await db
      .delete(teamMembers)
      .where(
        eq(teamMembers.teamId, teamId) && eq(teamMembers.userId, memberId)
      );
    if (result.count === 0) {
      return NextResponse.json(
        { error: "No team member found to delete" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Team member deleted successfully" });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Team member deletion failed", details: error },
      { status: 500 }
    );
  }
}
