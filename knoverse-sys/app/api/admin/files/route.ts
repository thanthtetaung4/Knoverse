import { NextResponse, NextRequest } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { db } from "@/db";
import { teamFiles, objects } from "@/db/schema";
import { eq } from "drizzle-orm";
import checkUserRole from "@/lib/checkUserRole";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("Authorization");
	const accessToken = authHeader?.replace("Bearer ", "");
	const params = request.nextUrl.searchParams;
	const teamId = params.get("teamId");

	if (!teamId) {
		return NextResponse.json(
			{ error: "Missing teamId query parameter" },
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

  const isAdmin: boolean = await checkUserRole(authResult.user);
  if (!isAdmin) {
	return NextResponse.json({ error: "Not Allowed" }, { status: 405 });
  }
	try {
		// Join team_files with storage.objects to return friendly file data
		console.log("Fetching files for teamId:", teamId);
		const rows = await db.select({ file: objects.name, id: objects.id }).from(objects).leftJoin(teamFiles, eq(objects.id, teamFiles.objectId)).where(eq(teamFiles.teamId, teamId));
		console.log("Retrieved files:", rows);

		return NextResponse.json({ rows });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to retrieve files", details: String(error) },
			{ status: 500 }
		);
	}
}
