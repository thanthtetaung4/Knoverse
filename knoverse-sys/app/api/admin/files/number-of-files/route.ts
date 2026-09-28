import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { teamFiles } from "@/db/schema";
import { withAuth } from "@/lib/api/handler";

export const GET = withAuth(
  async () => {
    const [result] = await db.select({ totalFiles: count(teamFiles.id) }).from(teamFiles);
    return NextResponse.json({ numberOfFiles: result.totalFiles });
  },
  { admin: true }
);
