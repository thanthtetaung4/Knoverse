import { checkAuth } from '@/lib/auth/checkAuth';
import { getUser } from '@/lib/supabase/getUser';
import { NextRequest, NextResponse } from 'next/server';

export async function GET (request: NextRequest) {
	// Check authentication and get the Supabase user
	const authHeader = request.headers.get('Authorization') || '';
	const tokenMatch = authHeader.match(/^Bearer (.+)$/);
	const accessToken = tokenMatch ? tokenMatch[1] : '';

	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
	}

	if (!authResult.user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	// Fetch the application user from the database
	const appUser = await getUser(authResult.user);
	if (!appUser) {
		return new Response(JSON.stringify({ error: 'User not found in database' }), { status: 404 });
	}
	return NextResponse.json({ user: appUser });
}
