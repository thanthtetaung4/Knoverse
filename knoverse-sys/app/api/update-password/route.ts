import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, parseJson, withAuth } from "@/lib/api/handler";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`),
});

/** Change the signed-in user's own password. */
export const POST = withAuth(async (request, { authUser }) => {
  const { password } = await parseJson(request, bodySchema);

  const { error } = await createAdminClient().auth.admin.updateUserById(authUser.id, { password });
  if (error) {
    throw new HttpError(400, error.message ?? "Password update failed");
  }

  return NextResponse.json({ message: "Password updated successfully" });
});
