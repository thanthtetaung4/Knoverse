"use client";

import React, { createContext, useContext, useEffect, useState } from "react"
import type { UserDB } from "@/db/schema"
import { Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import ThemeToggle from '@/components/theme-toggle';

type UserContextType = {
  user: UserDB | null;
  setUser: (u: UserDB | null) => void;
  accessToken: string | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export type ApiUserResponse = { user: UserDB | null };

export async function fetchUserDataFromApi(
  accessToken: string
): Promise<ApiUserResponse | null> {
  try {
    console.log("fetchUserDataFromApi called with accessToken:", accessToken);
    const res = await fetch("/api/get/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error("getUser API returned non-OK status", res.status);
      return null;
    }
    const json = await res.json();
    return json as ApiUserResponse;
  } catch (err) {
    console.error("Error fetching user data:", err);
    return null;
  }
}

export default function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserDB | null>(null);

  const supabase = createClient();

  // auth listener
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // update session immediately on auth change (sign in / sign out / token refresh)
      setSession(session ?? null);
    });

    return () => {
      isMounted = false;
      try {
        subscription.unsubscribe();
      } catch (e) {
        console.warn("Failed to unsubscribe auth listener", e);
      }
    };
  }, []);

  // fetch user ONLY when session changes
  useEffect(() => {
    if (!session) return;

    const handleUser = async () => {
      console.log("fetching user…");
      const resp = await fetchUserDataFromApi(session.access_token);
      console.log("resp user:", resp?.user);
      setUser(resp?.user ?? null);
    };

    handleUser();
  }, [session]);

  // console.log("session:", session)

  return (
    <UserContext.Provider value={{ user, setUser, accessToken: session?.access_token ?? null}}>
      {user?.role === 'member' &&
        <div className='flex flex-col h-full'>
          <div className="flex border rounded-3xl mb-2 justify-center items-center h-10">
            <h3>Knoverse</h3>
            <div className='absolute right-20'>
              <ThemeToggle noBorder />
            </div>
          </div>
          {children}
        </div>
      }
      {user?.role === 'admin' && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
