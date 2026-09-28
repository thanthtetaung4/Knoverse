import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/handler';

export const GET = withAuth(async (_request, { user }) => {
	return NextResponse.json({ user });
});
