import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { checkAuth } from "@/lib/auth/checkAuth";
import { getUser } from "@/lib/supabase/getUser";
import type { UserDB } from "@/db/schema";

export type AuthContext = {
  /** Supabase auth user */
  authUser: User;
  /** Row from the app's `users` table */
  user: UserDB;
  accessToken: string;
};

/** Throw from a handler to return `{ error: message }` with the given status. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function bearerToken(request: NextRequest): string | null {
  const match = request.headers.get("Authorization")?.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

type AuthedHandler = (request: NextRequest, auth: AuthContext) => Promise<Response>;

/**
 * Wrap a route handler so it only runs for an authenticated user (and, with
 * `{ admin: true }`, only for admins). Unexpected errors are logged server-side
 * and returned as a generic 500 so internals never leak to the client.
 */
export function withAuth(handler: AuthedHandler, options: { admin?: boolean } = {}) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const accessToken = bearerToken(request);
      if (!accessToken) return jsonError("Missing Authorization header", 401);

      const authResult = await checkAuth(accessToken);
      if (!authResult.success) return jsonError(authResult.error, 401);

      const user = await getUser(authResult.user);
      if (!user) return jsonError("User not found in database", 404);

      if (options.admin && user.role !== "admin") return jsonError("Forbidden", 403);

      return await handler(request, { authUser: authResult.user, user, accessToken });
    } catch (error: unknown) {
      if (error instanceof HttpError) return jsonError(error.message, error.status);
      console.error(`${request.method} ${request.nextUrl.pathname} failed:`, error);
      return jsonError("Internal server error", 500);
    }
  };
}

function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  const path = issue?.path.join(".");
  return path ? `${path}: ${issue.message}` : issue?.message ?? "Invalid request";
}

/** Parse and validate a JSON body; throws HttpError(400) when invalid. */
export async function parseJson<T extends z.ZodType>(request: NextRequest, schema: T): Promise<z.infer<T>> {
  const body = await request.json().catch(() => {
    throw new HttpError(400, "Request body must be valid JSON");
  });
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(400, firstIssue(result.error));
  return result.data;
}

/** Validate query parameters; throws HttpError(400) when invalid. */
export function parseQuery<T extends z.ZodType>(request: NextRequest, schema: T): z.infer<T> {
  const result = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!result.success) throw new HttpError(400, firstIssue(result.error));
  return result.data;
}
