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
          lastUpdated: new Date(),
        })
        .returning({ insertedId: chatSessions.id });
      console.log("Insert result:", inserted);
      newSessionId = inserted[0].insertedId;
      console.log("Created new chat session with id:", newSessionId);
    } catch (error: unknown) {
      return NextResponse.json(
        { error: "Error creating new chat session" + error },
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
    console.log("PY_SERVER_URL:", pythonServerBase);
    if (!pythonServerBase) {
      console.error("PY_SERVER_URL is not set in environment");
      return NextResponse.json(
        { error: "Backend misconfiguration: PY_SERVER_URL not set" },
        { status: 500 }
      );
    }
    const pythonEndpoint = `${pythonServerBase.replace(/\/$/, "")}/chat`;
    console.log("Python endpoint:", pythonEndpoint);
    const pythonResp = await fetch(pythonEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId: newSessionId, teamId }),
    });
    console.log("Python server response status:", pythonResp.status);
    if (!pythonResp.ok) {
      const respText = await pythonResp.text().catch(() => "<failed to read body>");
      console.error("Python server returned non-OK:", pythonResp.status, respText);
      return NextResponse.json(
        { error: "Python server returned non-OK response", status: pythonResp.status, body: respText },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error("Error sending message to Python server:", errMsg);
    return NextResponse.json(
      { error: "Error sending message to Python server", details: errMsg },
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

    try {
    await db.update(chatSessions).set({
      lastUpdated: new Date(),
    }).where(eq(chatSessions.id, newSessionId));
  } catch (error: unknown) {
    void error;
    console.log("Error logging analytics event");
  }

  return NextResponse.json({
    message: "Message sent to Python server successfully",
    sessionId: newSessionId,
  });
}
