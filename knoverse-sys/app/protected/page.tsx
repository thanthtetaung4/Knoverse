'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/client'
import type { UserDB } from '@/db/schema'

export default function ProtectedPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [apiEmail, setApiEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      setEmail(session.user.email ?? null)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const testAuthApi = async () => {
    setApiLoading(true)
    setApiError(null)
    setApiEmail(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setApiError('No session found')
      setApiLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      // Use Supabase client for frontend queries (Drizzle is server-only)
      const userData = await fetch('/api/get/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      }).then(res => res.json()).catch(err => {
        console.error('Error fetching user data:', err);
        return { user: null };
      });

      const user: UserDB = userData.user || null;
      if (!response.ok) {
        setApiError(data.error || 'API request failed')
      } else {
        setApiEmail(data.email)
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setApiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-svh w-full flex-col items-center justify-center gap-4">
      <p>
        Hello <span className="font-semibold">{email}</span>
      </p>

      <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
        <p className="text-sm text-gray-500">Test Auth API</p>
        <button
          onClick={testAuthApi}
          disabled={apiLoading}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {apiLoading ? 'Testing...' : 'Call /api/auth/me'}
        </button>

        {apiEmail && (
          <p className="text-sm text-green-600">
            ✓ API returned: <span className="font-semibold">{apiEmail}</span>
          </p>
        )}

        {apiError && (
          <p className="text-sm text-red-500">
            ✗ Error: {apiError}
          </p>
        )}
      </div>

      <LogoutButton />
    </div>
  )
}
