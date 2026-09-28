import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { HttpError, jsonError, parseQuery, withAuth } from "@/lib/api/handler";

const querySchema = z.object({ chatSessionId: z.uuid() });

export const GET = withAuth(async (request, { user }) => {
	const { chatSessionId } = parseQuery(request, querySchema);

	const [session] = await db
		.select({ userId: chatSessions.userId })
		.from(chatSessions)
		.where(eq(chatSessions.id, chatSessionId));
	if (!session) throw new HttpError(404, "Chat session not found");

	if (session.userId !== user.id) {
		return jsonError("Unauthorized access to chat history", 403);
	}

	const chatHistory = await db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.chatSessionId, chatSessionId))
		.orderBy(asc(chatMessages.createdAt));

	return NextResponse.json({ chatHistory });
});
