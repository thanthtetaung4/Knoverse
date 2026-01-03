"use client";

import React, { useEffect} from "react";
import { useUser } from "@/app/providers/UserProvider";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserDB } from "@/db/schema";
import { LogoutButton } from '@/components/logout-button'
import ThemeToggle from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';
import {FaCog, FaSignOutAlt,FaSun,FaMoon,FaQuestion, FaSearch} from 'react-icons/fa';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return; // wait until user is known

    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);
  if (user?.role !== "admin") {
    return null; // nothing while redirecting
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
	    	<h2 className="font-bold text-base md:text-lg">{user.fullName}</h2>
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
