import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, asc, and, desc } from "drizzle-orm";
import { checkAuth } from "@/lib/auth/checkAuth";
import { getUser } from "@/lib/supabase/getUser";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  if (!teamId) {
    return NextResponse.json(
      { error: "Missing teamId parameter" },
      { status: 400 }
    );
  }

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

  const user = await getUser(authResult.user);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  try {
    const session = await db
      .select()
      .from(chatSessions)
      .where(
        and(eq(chatSessions.teamId, teamId), eq(chatSessions.userId, user.id))
      )
      .orderBy(desc(chatSessions.lastUpdated));
    return NextResponse.json({ chatSession: session || null });
  } catch (err) {
    console.error("Error fetching chat session:", err);
    return NextResponse.json(
      { error: "Failed to fetch chat session", details: err },
      { status: 500 }
    );
  }
}
