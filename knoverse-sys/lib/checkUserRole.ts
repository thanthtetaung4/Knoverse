import { User } from "@supabase/supabase-js"
import { UserDB } from "@/db/schema"
import { getUser } from "./supabase/getUser"
export default async function checkUserRole(user: User) {
	const userDb: UserDB | null = await getUser(user);
	return (userDb?.role == "admin");
}
