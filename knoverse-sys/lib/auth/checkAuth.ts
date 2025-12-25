import { createClient } from '@supabase/supabase-js'

export type AuthResult = {
  success: true
  user: {
    id: string
    email: string
  }
} | {
  success: false
  error: string
}

/**
 * Checks authentication by verifying the access token with Supabase.
 * Use this function to guard API routes.
 *
 * @param accessToken - The JWT access token from the frontend
 * @returns AuthResult with user info if authenticated, or error if not
 */
export async function checkAuth(accessToken: string): Promise<AuthResult> {
  if (!accessToken) {
    return { success: false, error: 'No access token provided' }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  )

  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    return { success: false, error: error?.message || 'Invalid or expired token' }
  }

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email!,
    },
  }
}
