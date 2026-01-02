'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'
import { FaSignOutAlt } from 'react-icons/fa';
import { ImExit } from "react-icons/im";

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <Button onClick={logout} aria-label="Logout" className="flex items-center gap-2" variant="outline" size="icon">
      <ImExit className="h-4 w-4" />
    </Button>
  )
}
