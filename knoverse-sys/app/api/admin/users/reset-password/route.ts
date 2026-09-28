import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, parseJson, withAuth } from "@/lib/api/handler";
import { generatePassword } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ userId: z.uuid() });

export const POST = withAuth(
  async (request) => {
    const { userId } = await parseJson(request, bodySchema);
    const password = generatePassword();

    const { data, error } = await createAdminClient().auth.admin.updateUserById(userId, { password });
    if (error || !data.user) {
      console.error("Error resetting user password in Supabase:", error);
      throw new HttpError(500, "Password Reset Failed");
    }

    return NextResponse.json({ message: "User password reset successfully", password });
  },
  { admin: true }
);
