import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/handler'

/** Returns the authenticated user's email and id. */
export const GET = withAuth(async (_request, { authUser }) => {
  return NextResponse.json({
    email: authUser.email,
    userId: authUser.id,
  })
})
