import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { HttpError, jsonError, parseJson, withAuth } from "@/lib/api/handler";
import { generatePassword } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";

const userColumns = {
  id: users.id,
  email: users.email,
  role: users.role,
  fullName: users.fullName,
  createdAt: users.createdAt,
};

const createSchema = z.object({
  userName: z.string().trim().min(1).max(100),
  userRole: z.enum(["admin", "manager", "member"]),
  email: z.email(),
});

const deleteSchema = z.object({ userId: z.uuid() });

export const GET = withAuth(
  async () => {
    const allUsers = await db.select(userColumns).from(users);
    return NextResponse.json({ users: allUsers });
  },
  { admin: true }
);

export const POST = withAuth(
  async (request) => {
    const { userName, userRole, email } = await parseJson(request, createSchema);
    const password = generatePassword();

    // Admin API: creates the account without touching the calling admin's session.
    // The `users` row is created by the auth.users trigger; we then fill in name/role.
    const { data, error } = await createAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      console.error("Supabase createUser failed:", error);
      throw new HttpError(error?.status === 422 ? 409 : 500, error?.message ?? "User Creation Failed");
    }

    const userId = data.user.id;
    const result = await db.update(users).set({ fullName: userName, role: userRole }).where(eq(users.id, userId));
    if (result.count === 0) return jsonError("Error updating user", 404);

    const [createdUser] = await db.select(userColumns).from(users).where(eq(users.id, userId));

    return NextResponse.json({
      message: `User created successfully with email: ${email}`,
      user: createdUser ?? null,
      email,
      password,
    });
  },
  { admin: true }
);

export const DELETE = withAuth(
  async (request, { user }) => {
    const { userId } = await parseJson(request, deleteSchema);
    if (userId === user.id) throw new HttpError(400, "You cannot delete your own account");

    // Deleting the auth user cascades to the `users` row.
    const { error } = await createAdminClient().auth.admin.deleteUser(userId);
    if (error) {
      console.error("Supabase admin.deleteUser returned error:", error);
      throw new HttpError(500, "Error deleting user in Supabase");
    }
    return NextResponse.json({ message: "User deleted successfully" });
  },
  { admin: true }
);
