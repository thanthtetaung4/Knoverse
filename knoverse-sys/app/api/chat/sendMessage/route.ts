import { NextResponse, NextRequest } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { chatSessions, analyticsEvents, UserDB } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/supabase/getUser";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  const { message, sessionId, teamId } = await request.json();
  let newSessionId = sessionId;

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

  const user: UserDB | null = await getUser(authResult.user);
  if (!user) {
    return NextResponse.json(
      { error: "User not found in database" },
      { status: 404 }
    );
  }

  if (!message || !teamId) {
    return NextResponse.json(
      { error: "Missing message or teamId" },
      { status: 400 }
    );
  }

  if (!sessionId) {
    try {
      // Cast the insert result to an array with objects that contain id so TypeScript recognizes it.
      const inserted = await db
        .insert(chatSessions)
        .values({
          userId: user.id,
          teamId: teamId,
        })
        .returning({ insertedId: chatSessions.id });
      console.log("Insert result:", inserted);
      newSessionId = inserted[0].insertedId;
      console.log("Created new chat session with id:", newSessionId);
    } catch (error: unknown) {
      return NextResponse.json(
        { error: "Error creating new chat session" },
        { status: 500 }
      );
    }
  }
  let userId;
  try {
    userId = await db
      .select({ userId: chatSessions.userId })
      .from(chatSessions)
      .where(eq(chatSessions.id, newSessionId));
  } catch (error: unknown) {
    void error;
    return NextResponse.json(
      { error: "Error fetching chat session" },
      { status: 500 }
    );
  }

  if (!userId) {
    return NextResponse.json({ error: "Wrong sessionId" }, { status: 400 });
  }

  if (userId[0]?.userId !== user.id) {
    return NextResponse.json(
      { error: "Unauthorized access to this chat session" },
      { status: 403 }
    );
  }

  console.log("Received message:", message, "for sessionId:", newSessionId);
  try {
    const pythonServerBase = process.env.PY_SERVER_URL ?? "";
    const pythonEndpoint = `${pythonServerBase.replace(/\/$/, "")}/chat`;
    const pythonResp = await fetch(pythonEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId: newSessionId, teamId }),
    });
    console.log("Python server response status:", pythonResp.status);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Error sending message to Python server", details: error },
      { status: 500 }
    );
  }

  try {
    await db.insert(analyticsEvents).values({
      userId: user.id,
      teamId: teamId,
    });
  } catch (error: unknown) {
    void error;
    console.log("Error logging analytics event");
  }

  return NextResponse.json({
    message: "Message sent to Python server successfully",
  });
}
