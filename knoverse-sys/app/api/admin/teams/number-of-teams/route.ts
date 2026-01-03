import { NextResponse, NextRequest } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { count } from "drizzle-orm";
import checkUserRole from "@/lib/checkUserRole";

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
    const result = await db
      .select({
        totalTeams: count(teams.id),
      })
      .from(teams);

    return NextResponse.json({ numberOfTeams: result[0].totalTeams });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve team count", details: error },
      { status: 500 }
    );
  }
}
