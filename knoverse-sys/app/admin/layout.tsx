"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/logout-button";
import {
  ApiUserResponse,
  fetchUserDataFromApi,
} from "@/app/providers/UserProvider";

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
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header style={{ padding: 16, borderBottom: "1px solid #eaeaea" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", fontWeight: 600 }}>
          Admin
        </div>
      </header>

      <main
        style={{ flex: 1, maxWidth: 1200, margin: "24px auto", width: "100%" }}
      >
        <nav>
          <LogoutButton />
        </nav>
        {children}
      </main>

      <footer
        style={{
          padding: 12,
          borderTop: "1px solid #eaeaea",
          textAlign: "center",
        }}
      >
        © {new Date().getFullYear()} Knoverse
      </footer>
    </div>
  );
}
