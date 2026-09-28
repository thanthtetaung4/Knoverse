import { randomBytes } from "crypto";

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt (used by Supabase Auth) ignores everything after 72 bytes
export const MAX_PASSWORD_LENGTH = 72;

/** Cryptographically random, URL-safe temporary password (16 chars, ~96 bits). */
export function generatePassword(): string {
  return randomBytes(12).toString("base64url");
}
