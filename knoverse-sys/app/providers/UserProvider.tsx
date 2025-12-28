"use client"

import React, { createContext, useContext, useState } from 'react'
import type { User } from '@supabase/supabase-js'

type UserContextType = {
  user: User | null
  setUser: (u: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser?: User | null
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null)

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export default UserProvider
