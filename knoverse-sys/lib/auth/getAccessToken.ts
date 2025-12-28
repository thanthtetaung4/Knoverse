import { createClient } from '../supabase/client';

export async function getAccessToken() {
  const supabase = createClient();
  const {
	data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token;
}
