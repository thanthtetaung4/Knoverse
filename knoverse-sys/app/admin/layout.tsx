"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserDB } from "@/db/schema";
import { LogoutButton } from '@/components/logout-button'
import ThemeToggle from '@/components/theme-toggle'

type ApiUserResponse = { user: UserDB | null };

async function fetchUserDataFromApi(accessToken: string): Promise<ApiUserResponse | null> {
	try {
		const res = await fetch("/api/get/getUser", {
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { user } = useUser();``
	const router = useRouter();

	// undefined = loading, null = fetched but no user, object = response
	const [userData, setUserData] = useState<ApiUserResponse | null | undefined>(undefined);

	useEffect(() => {
		let mounted = true;
		async function load() {
			if (!user) {
				// no authenticated supabase user -> redirect
				if (mounted) {
					setUserData(null);
					router.push("/auth/login");
				}
				return;
			}

			const supabase = createClient();
			const { data: { session } } = await supabase.auth.getSession();
			const token = session?.access_token;
			if (!token) {
				if (mounted) {
					setUserData(null);
					router.push("/");
				}
				return;
			}

			const resp = await fetchUserDataFromApi(token);
			if (!mounted) return;
			setUserData(resp);
			// if not admin, redirect
			if (!resp?.user || resp.user.role !== "admin") {
				router.push("/");
			}
		}

		load();
		return () => {
			mounted = false;
		};
	}, [user, router]);

	// While loading, render nothing (or a spinner if you prefer)
	if (userData === undefined) return null;

	// If fetched but no app user or not admin, we've already redirected; still guard render
	if (!userData || !userData.user || userData.user.role !== "admin") {
		return null;
	}

	return (
	<div className="flex min-h-screen">
      <aside className="w-60 border-r p-4">
        <h2 className="font-bold mb-4">Admin</h2>

        <nav className="flex flex-col gap-2">
          <a href="/admin" className="hover:underline">
            Dashboard
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
	  <div className="absolute top-4 right-4 flex items-center gap-2">
		<ThemeToggle />
		<LogoutButton />
		</div>    
	</div>
  );
}
