import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { analyticsEvents, chatSessions } from "@/db/schema";
import { callAiService } from "@/lib/aiService";
import { HttpError, jsonError, parseJson, withAuth } from "@/lib/api/handler";
import { canAccessTeam } from "@/lib/teams";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  sessionId: z.uuid().nullish(),
  teamId: z.uuid(),
});

export const POST = withAuth(async (request, { user }) => {
  const { message, sessionId, teamId } = await parseJson(request, bodySchema);

  // Only members of the team (or admins) may query its documents.
  if (!(await canAccessTeam(user, teamId))) {
    return jsonError("You are not a member of this team", 403);
  }

  let chatSessionId = sessionId;
  if (chatSessionId) {
    const [session] = await db
      .select({ userId: chatSessions.userId, teamId: chatSessions.teamId })
      .from(chatSessions)
      .where(eq(chatSessions.id, chatSessionId));
    if (!session) throw new HttpError(404, "Chat session not found");
    if (session.userId !== user.id || session.teamId !== teamId) {
      return jsonError("Unauthorized access to this chat session", 403);
    }
  } else {
    const [inserted] = await db
      .insert(chatSessions)
      .values({ userId: user.id, teamId, lastUpdated: new Date() })
      .returning({ id: chatSessions.id });
    chatSessionId = inserted.id;
  }

  try {
    await callAiService("/chat", "POST", { message, sessionId: chatSessionId, teamId });
  } catch (error) {
    console.error("AI chat call failed:", error);
    return jsonError("The AI service could not answer right now", 502);
  }

  // Analytics and the session timestamp are best-effort; the answer is already saved.
  await Promise.allSettled([
    db.insert(analyticsEvents).values({ userId: user.id, teamId }),
    db.update(chatSessions).set({ lastUpdated: new Date() }).where(eq(chatSessions.id, chatSessionId)),
  ]);

  return NextResponse.json({
    message: "Message sent to Python server successfully",
    sessionId: chatSessionId,
  });
});
