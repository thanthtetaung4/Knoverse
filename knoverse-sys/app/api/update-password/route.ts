import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAuth } from "@/lib/auth/checkAuth";

export async function POST(request: NextRequest) {
	const authHeader = request.headers.get("Authorization");
	const accessToken = authHeader?.replace("Bearer ", "");
	const { password } = await request.json();

	if (!accessToken) {
		return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
	}

	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return NextResponse.json({ error: authResult.error }, { status: 401 });
	}

	const email = authResult.user.email;

	if (!email || typeof email !== 'string') {
		return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 });
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
	// prefer the service role key on the server for admin operations
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
	if (!supabaseUrl || !supabaseKey) {
		return NextResponse.json({ error: 'Supabase not configured on server' }, { status: 500 });
	}

	const supabase = createClient(supabaseUrl, supabaseKey);


	try {
			const userId = authResult.user?.id;
			if (!userId) return NextResponse.json({ error: 'Authenticated user id missing' }, { status: 400 });

			// Use admin API to update user password server-side
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { error } = await ((supabase.auth as any).admin.updateUserById(userId, { password }));

			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return NextResponse.json({ error: "Supabase err: " + (error.message ?? String(error)), name: (error as any)?.name }, { status: 400 });
			}

		return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
	} catch (err: unknown) {
		return NextResponse.json({ error: String(err) }, { status: 500 });
	}
}
