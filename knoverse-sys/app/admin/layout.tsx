"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserDB } from "@/db/schema";
import { LogoutButton } from '@/components/logout-button'

type ApiUserResponse = { user: UserDB | null };

async function fetchUserDataFromApi(accessToken: string): Promise<ApiUserResponse | null> {
	try {
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { user } = useUser();
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
		<div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
			<header style={{ padding: 16, borderBottom: "1px solid #eaeaea" }}>
				<div style={{ maxWidth: 1200, margin: "0 auto", fontWeight: 600 }}>Admin</div>
			</header>

			<main style={{ flex: 1, maxWidth: 1200, margin: "24px auto", width: "100%" }}>
				<nav>
					<LogoutButton />
				</nav>
				{children}
			</main>

			<footer style={{ padding: 12, borderTop: "1px solid #eaeaea", textAlign: "center" }}>
				© {new Date().getFullYear()} Knoverse
			</footer>
		</div>
	);
}
