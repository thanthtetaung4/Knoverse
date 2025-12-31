"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserDB } from "@/db/schema";
import { LogoutButton } from '@/components/logout-button'
import ThemeToggle from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';
import {FaCog, FaSignOutAlt,FaSun,FaMoon	,FaQuestion, FaSearch} from 'react-icons/fa';
import Link from "next/link";
import { Button } from "@/components/ui/button";
 
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
	<div className="flex min-h-screen flex-col md:flex-row">
 	  <aside className="w-full md:w-60 border-b md:border-r p-4 flex flex-col">
		<div className="text-left mt-6">
			<h1 className="text-2xl font-sans">Knoverse</h1>
			<Separator className="my-10" />
		</div>
		<nav className="flex gap-4 md:flex-col md:gap-6 overflow-x-auto md:overflow-x-visible">
          <a href="/admin" className="hover:text-red-500">
            Dashboard
          </a>
		  <a href="/admin/manage-teams" className="hover:text-red-500">
            Manage Teams
          </a>
		  <a href="/admin/manage-users" className="hover:text-red-500">
			Manage Users
		  </a>
		  <a href="/admin/manage-files" className="hover:text-red-500">
			Manage Files
		  </a>
		  <a href="/admin/reports" className="hover:text-red-500">
			Reports
		  </a>
        </nav>
		<aside className="flex gap-2 md:flex-col md:gap-6 overflow-x-auto md:overflow-x-visible bottom-aside mt-auto">	
		<aside className="flex gap-4 md:flex md:gap-4">
			<Avatar>
			  <AvatarImage src="https://github.com/shadcn.png" />
			  <AvatarFallback>CN</AvatarFallback>
			</Avatar>				
	    	<h2 className="font-bold text-base md:text-lg">{userData.user.fullName}</h2>
		</aside>
		<aside className="flex-row gap-4 md:flex md:gap-4">
			<LogoutButton />
			<ThemeToggle />
			<Button variant="outline" size="icon" aria-label="Settings">
				<a href="/admin/settings">
			  <FaCog className="h-4 w-4" />
			  </a>
			</Button>
		</aside>
      </aside>
	  </aside>
	  <main className="flex-1 p-6">{children}</main> 
	</div>
  );
}
