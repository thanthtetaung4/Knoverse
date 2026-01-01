import { checkAuth } from '@/lib/auth/checkAuth';
import { getUser } from '@/lib/supabase/getUser';
import { NextRequest, NextResponse } from 'next/server';
import checkUserRole from "@/lib/checkUserRole";
import { users } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/client';

export async function GET (request: NextRequest) {
	// Check authentication and get the Supabase user
	const authHeader = request.headers.get('Authorization') || '';
	const tokenMatch = authHeader.match(/^Bearer (.+)$/);
	const accessToken = tokenMatch ? tokenMatch[1] : '';

	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
	}

	// Fetch the application user from the database
	const appUser = await getUser(authResult.user);
	if (!appUser) {
		return new Response(JSON.stringify({ error: 'User not found in database' }), { status: 404 });
	}
	return NextResponse.json({ user: appUser });
}

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const userName = formData.get("userName") as string | null;
	const userRole = formData.get("userRole") as string | null;
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

	if (!userName || !userRole) {
		return NextResponse.json({ error: "Missing team description or teamName" }, { status: 400 });
	}

	if (userRole !=  "admin" && userRole != "manager" && userRole != "member") {
		return NextResponse.json({error: "invalid user type"}, {status: 400})
	}

	try {
		const supabase = await createClient();
		const authUser = await supabase.auth.signUp({
			email: 'example@email.com',
			password: 'example-password',
			});
		if (!authUser.data.user) {
			return NextResponse.json({error: "User Creation Failed"}, {status: 500})
		}

		const userId = authUser.data.user.id;
		const role: "admin" | "manager" | "member" = userRole as "admin" | "manager" | "member";
		const result = await db.update(users)
				.set({ fullName: userName, role: role})
				.where(eq(users.id, userId));

		if (result.count === 0) {
			return NextResponse.json({ error: "No team found to update" }, { status: 404 });
		}
		return NextResponse.json({ message: "Team updated successfully" });
	} catch (error: unknown) {
		return NextResponse.json({ error: "Team update failed", details: error }, { status: 500 });
	}

}

export async function DELETE(request: NextRequest) {
	const authHeader = request.headers.get("Authorization");
	const accessToken = authHeader?.replace("Bearer ", "");
	const { userId } = await request.json();

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

	if (!userId) {
		return NextResponse.json({ error: "Missing userId" }, { status: 400 });
	}

	try {
		const result = await
			db.delete(users)
			.where(eq(users.id, userId));

		if (result.count === 0) {
			return NextResponse.json({ error: "No user found to delete" }, { status: 404 });
		}

		const supabase = await createClient();
		const { error } = await supabase.auth.admin.deleteUser(userId);
		if (!error) {
			return NextResponse.json({message: "Error deleting user"}, {status: 500});
		}
		return NextResponse.json({ message: `User deleted successfully` });
	} catch (error: unknown) {
		return NextResponse.json({ error: "User deletion failed", details: error }, { status: 500 });
	}

}
