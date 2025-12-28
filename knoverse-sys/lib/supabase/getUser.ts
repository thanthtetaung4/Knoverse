import { User } from '@supabase/supabase-js'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Fetch the application user row that corresponds to a Supabase auth user.
 *
 * @param supabaseUser - a Supabase `User` object (usually from session.user)
 * @returns the DB `users` row or null if not found
 */
export async function getUser(supabaseUser: User | null | undefined) {
	console.log('Fetching user for Supabase ID:', supabaseUser);
	if (!supabaseUser?.id) return null

	console.log('Fetching user for Supabase ID:', supabaseUser.id);
	const rows = await db.select().from(users).where(eq(users.id, supabaseUser.id))
	return rows[0] ?? null
}
