import { checkAuth } from "@/lib/auth/checkAuth";
import { NextRequest, NextResponse } from "next/server";
import checkUserRole from "@/lib/checkUserRole";
import { users } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Check authentication and get the Supabase user
  const authHeader = request.headers.get("Authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer (.+)$/);
  const accessToken = tokenMatch ? tokenMatch[1] : "";

  const authResult = await checkAuth(accessToken);
  if (!authResult.success) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: 401,
    });
  }

  // Only admins can list users
  const isAdmin: boolean = await checkUserRole(authResult.user);
  if (!isAdmin) {
    return NextResponse.json({ error: "Not Allowed" }, { status: 405 });
  }

  // Fetch all users from the database
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
        createdAt: users.createdAt,
      })
      .from(users);

    return NextResponse.json({ users: allUsers });
  } catch (err) {
    console.error("Error fetching users list", err);
    return NextResponse.json(
      { error: "Failed to fetch users", details: err },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { userName, userRole, email } = await request.json();
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  // Check authentication
  const authResult = await checkAuth(accessToken);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const isAdmin: boolean = await checkUserRole(authResult.user);
  if (!isAdmin) {
    return NextResponse.json({ error: "Not Allowed" }, { status: 405 });
  }

  if (!userName || !userRole) {
    return NextResponse.json(
      { error: "Missing team description or teamName" },
      { status: 400 }
    );
  }

  if (userRole != "admin" && userRole != "manager" && userRole != "member") {
    return NextResponse.json({ error: "invalid user type" }, { status: 400 });
  }

  try {
    let authUser;
    let password: string | undefined = undefined;
    try {
      console.log("Creating user with email:", email);
      password = Math.random().toString(36).slice(-8);
      const supabase = await createClient();
      authUser = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      console.log("authUser", authUser);
      if (!authUser.data.user) {
        return NextResponse.json(
          { error: "User Creation Failed" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Error creating user in Supabase:", error);
      return NextResponse.json(
        { error: "User Creation Failed", details: error },
        { status: 500 }
      );
    }

    const userId = authUser.data.user.id;
    const role: "admin" | "manager" | "member" = userRole as
      | "admin"
      | "manager"
      | "member";

    try {
      const result = await db
        .update(users)
        .set({ fullName: userName, role: role })
        .where(eq(users.id, userId));

      if (result.count === 0) {
        return NextResponse.json(
          { error: "Error updating user" },
          { status: 404 }
        );
      }

      // Fetch the created/updated user row to return to client
      const createdRows = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      const createdUser = createdRows[0] ?? null;

      return NextResponse.json({
        message: `User created successfully with email: ${email}`,
        user: createdUser,
        email,
        password,
      });
    } catch (error) {
      console.error("Error updating user in database:", error);
      return NextResponse.json(
        { error: "Database update failed", details: error },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "User update failed", details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  const { userId } = await request.json();

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  // Check authentication
  const authResult = await checkAuth(accessToken);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const isAdmin: boolean = await checkUserRole(authResult.user);
  if (!isAdmin) {
    return NextResponse.json({ error: "Not Allowed" }, { status: 405 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // First attempt to delete the auth user in Supabase using the service role key
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server misconfiguration: missing service role key" },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    console.log("Attempting Supabase auth delete for ID:", userId);
    const deleteRes = await supabase.auth.admin.deleteUser(userId);
    console.log(
      "Supabase deleteUser response data:",
      deleteRes.data,
      "error:",
      deleteRes.error
    );

    if (deleteRes.error) {
      // If Supabase returns an error, do not proceed to remove DB row
      console.error(
        "Supabase admin.deleteUser returned error:",
        deleteRes.error
      );
      return NextResponse.json(
        { error: "Error deleting user in Supabase", details: deleteRes.error },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Exception while calling Supabase admin.deleteUser:", err);
    return NextResponse.json(
      { error: "Supabase deletion failed", details: err },
      { status: 500 }
    );
  }
  return NextResponse.json({ message: `User deleted successfully` });
}
