import { NextResponse, NextRequest } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import checkUserRole from "@/lib/checkUserRole";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer (.+)$/);
  const accessToken = tokenMatch ? tokenMatch[1] : "";

  const { userId } = await request.json();
  console.log("Resetting password for userId:", userId);

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

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server misconfiguration: missing service role key" },
        { status: 500 }
      );
    }
    let authUser;
    let password: string | undefined = undefined;
    try {
      password = Math.random().toString(36).slice(-8);
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      );
      authUser = await supabase.auth.admin.updateUserById(userId, {
        password: password,
      });
      if (!authUser.data.user) {
        return NextResponse.json(
          { error: "Password Reset Failed" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { message: "User password reset successfully", password: password },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error resetting user password in Supabase:", error);
      return NextResponse.json(
        { error: "Password Reset Failed", details: error },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error resetting user password", err);
    return NextResponse.json(
      { error: "Failed to reset password", details: err },
      { status: 500 }
    );
  }
}
