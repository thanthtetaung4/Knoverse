import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { withAuth } from "@/lib/api/handler";

export const GET = withAuth(
  async () => {
    const [result] = await db.select({ totalUsers: count(users.id) }).from(users);
    return NextResponse.json({ numberOfUsers: result.totalUsers });
  },
  { admin: true }
);
