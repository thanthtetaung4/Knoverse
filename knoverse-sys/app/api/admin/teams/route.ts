import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { objects, teamFiles, teams } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import checkUserRole from "@/lib/checkUserRole";

async function deleteTeamFiles(teamId: string, accessToken: string, baseUrl: string) {
  const files = await db
    .select({ objectId: teamFiles.objectId, name: objects.name })
    .from(teamFiles)
    .innerJoin(objects, eq(objects.id, teamFiles.objectId))
    .where(eq(teamFiles.teamId, teamId));

  if (files.length === 0) return;

  console.log(
    "Deleting files for team:",
    teamId,
    "Count:",
    files.length,
    "Files:",
    files
  );

  for (const file of files) {
    try {
      const deleteEndpoint = new URL("/api/admin/files/deleteFile", baseUrl).toString();
      const response = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fileId: file.objectId,
          filePath: file.name,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error(`Failed to delete file ${file.objectId}:`, text);
        throw new Error(`Failed to delete file ${file.objectId}`);
      }

      console.log("Successfully deleted file:", file.objectId);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  const { teamName, description } = await request.json();

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

  if (!description || !teamName) {
    return NextResponse.json(
      { error: "Missing team description or teamName" },
      { status: 400 }
    );
  }

  try {
    const result = await db.insert(teams).values({
      name: teamName,
      description: description,
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: "No team found to update" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Team updated successfully" });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Team update failed", details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  const { teamId } = await request.json();

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

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
  }

  try {
    const baseUrl = request.nextUrl.origin;
    await deleteTeamFiles(teamId, accessToken, baseUrl);

    console.log("Attempting to delete team with ID:", teamId);
    const result = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();
    console.log("Delete result:", result);
    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Team deletion failed", details: error },
      { status: 500 }
    );
  }
}

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

  try {
    const teamsList = await db.select().from(teams);
    return NextResponse.json({ teams: teamsList });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch teams", details: error },
      { status: 500 }
    );
  }
}
