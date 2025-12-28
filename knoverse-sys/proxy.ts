import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

// Public paths that should NOT be protected. Keep this list small and
// intentional: everything else will be validated by `updateSession`.
const PUBLIC_PREFIXES = [
  '/auth',
  '/api',
  '/public',
  '/favicon.ico',
  '/_next',
]

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public paths to pass through without touching the session logic.
  if (isPublicPath(pathname)) return NextResponse.next()

  // For all other requests, run the Supabase session updater which will
  // validate the session (and redirect to /auth/login when necessary).
  return await updateSession(request)
}

export const config = {
  // Match everything so the proxy can enforce protection globally. We keep
  // this broad matcher and rely on `isPublicPath` above to allow public
  // resources through. This pattern excludes only static image assets etc.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
