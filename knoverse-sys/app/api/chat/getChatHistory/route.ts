import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { chatSessions, UserDB } from "@/db/schema";
import { getUser } from "@/lib/supabase/getUser";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { and, asc, eq, } from "drizzle-orm";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("Authorization");
	const accessToken = authHeader?.replace("Bearer ", "");
	const { searchParams } = new URL(request.url);
	const chatSessionId = searchParams.get("chatSessionId");


	if (!accessToken) {
		return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
	}

	// Check authentication
	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return NextResponse.json({ error: authResult.error }, { status: 401 });
	}

	const user: UserDB | null= await getUser(authResult.user);
	if (!user) {
		return NextResponse.json({error: "User not found"}, {status: 404})
	}

	const sessionInfo = await db.select().from(chatSessions).where(eq(chatSessions.id, chatSessionId as string));
	const userId = sessionInfo[0]?.userId;

	if (!chatSessionId || !userId) {
		return NextResponse.json({ error: "Missing chatSessionId or userId" }, { status: 400 });
	}

	if (user.id !== userId) {
		return NextResponse.json({ error: "Unauthorized access to chat history" }, { status: 403 });
	}

	const chatHistory = await db.select().from(chatMessages).where(and(
		eq(chatMessages.chatSessionId, chatSessionId as string),
	)).orderBy(asc(chatMessages.createdAt));

	return NextResponse.json({ chatHistory });
}
