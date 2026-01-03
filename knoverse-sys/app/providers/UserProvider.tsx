"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserDB } from "@/db/schema";
import { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

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
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
    };
    load();
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
    <UserContext.Provider
      value={{ user, setUser, accessToken: session?.access_token ?? null }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
