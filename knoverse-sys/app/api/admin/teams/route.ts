import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { teams } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import checkUserRole from "@/lib/checkUserRole"

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const teamName = formData.get("teamName") as string | null;
	const description = formData.get("description") as string | null;
	const authHeader = request.headers.get("Authorization");
	const accessToken = authHeader?.replace("Bearer ", "");

	if (!accessToken) {
		return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
	}

	// Check authentication
	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return NextResponse.json({ error: authResult.error }, { status: 401 });
	}

	const isAdmin: boolean = await checkUserRole(authResult.user);
	if (!isAdmin) {
		return NextResponse.json({error: "Not Allowed"}, {status: 405})
	}

	if (!description || !teamName) {
		return NextResponse.json({ error: "Missing team description or teamName" }, { status: 400 });
	}


	try {
		const result = await
			db.insert(teams)
			.values({
				name: teamName,
				description: description,
			});
		if (result.count === 0) {
			return NextResponse.json({ error: "No team found to update" }, { status: 404 });
		}
		return NextResponse.json({ message: "Team updated successfully" });
	} catch (error: unknown) {
		return NextResponse.json({ error: "Team update failed", details: error }, { status: 500 });
	}

}

export async function DELETE(request: NextRequest) {
	const formData = await request.formData();
	const teamId = formData.get("teamId") as string | null;
	const authHeader = request.headers.get("Authorization");
	const accessToken = authHeader?.replace("Bearer ", "");

	if (!accessToken) {
		return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
	}

	// Check authentication
	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return NextResponse.json({ error: authResult.error }, { status: 401 });
	}

	const isAdmin: boolean = await checkUserRole(authResult.user);
	if (!isAdmin) {
		return NextResponse.json({error: "Not Allowed"}, {status: 405})
	}

	if (!teamId) {
		return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
	}

	try {
		const result = await
			db.delete(teams)
			.where(eq(teams.id, teamId));
		if (result.count === 0) {
			return NextResponse.json({ error: "No team found to delete" }, { status: 404 });
		}
		return NextResponse.json({ message: "Team deleted successfully" });
	} catch (error: unknown) {
		return NextResponse.json({ error: "Team deletion failed", details: error }, { status: 500 });
	}

}

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("Authorization");
	const accessToken = authHeader?.replace("Bearer ", "");
	if (!accessToken) {
		return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
	}

	// Check authentication
	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return NextResponse.json({ error: authResult.error }, { status: 401 });
	}

	try {
		const teamsList = await db.select().from(teams);
		return NextResponse.json({ teams: teamsList });
	} catch (error: unknown) {
		return NextResponse.json({ error: "Failed to fetch teams", details: error }, { status: 500 });
	}
}
