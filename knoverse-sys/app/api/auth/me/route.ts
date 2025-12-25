import { checkAuth } from '@/lib/auth/checkAuth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test API endpoint that returns the authenticated user's email.
 *
 * Example usage from frontend:
 * ```ts
 * const { data: { session } } = await supabase.auth.getSession()
 * const response = await fetch('/api/auth/me', {
 *   headers: {
 *     'Authorization': `Bearer ${session?.access_token}`
 *   }
 * })
 * const data = await response.json()
 * ```
 */
export async function GET(request: NextRequest) {
  // Extract the access token from Authorization header
  const authHeader = request.headers.get('Authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Missing Authorization header' },
      { status: 401 }
    )
  }

  // Check authentication
  const authResult = await checkAuth(accessToken)

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  // Return the authenticated user's email
  return NextResponse.json({
    email: authResult.user.email,
    userId: authResult.user.id,
  })
}
