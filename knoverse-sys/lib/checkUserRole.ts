import { User } from "@supabase/supabase-js"
import { UserDB } from "@/db/schema"
import { getUser } from "./supabase/getUser"
export default async function checkUserRole(user: User) {
	let userDb: UserDB | null;
	try {
		userDb = await getUser(user);
	} catch (error: unknown) {
		(void error);
		return false;
	}
	return (userDb?.role == "admin");
}
