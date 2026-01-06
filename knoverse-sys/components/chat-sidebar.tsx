"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import ChatList from "@/components/chatlist";
import { useParams, useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";

type Session = {
    id: string;
    teamId: string;
    userId: string;
    createdAt: Date | null;
}[]

export function ChatSideBar() {
	const { accessToken } = useUser();
	const [sessions, setSessions] = useState<Session>([]);
	const params = useParams();
	const teamId = (params as any)?.teamId;
	const router = useRouter();

	useEffect(() => {
		if (!teamId) return;
		// clear previous sessions immediately when team changes
		setSessions([]);
		let mounted = true;
		const fetchSessions = async () => {
			try {
				const response = await fetch(`/api/chat/getChatSession/?teamId=${teamId}`, {
					headers: {
					Authorization: `Bearer ${accessToken}`,
					},
				});
				const data = await response.json();
				if (mounted) setSessions(Array.isArray(data?.chatSession) ? data.chatSession : []);
			} catch (error) {
				console.error("Error fetching sessions:", error);
			}
		};
		fetchSessions();

		// Realtime subscription for new chat_sessions for this team
		let chanRef: any = null;
		const setupSubscription = async () => {
			const supabase = createClient();
			const chan = supabase
				.channel(`public:chat_sessions:team=${teamId}`)
				.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_sessions', filter: `team_id=eq.${teamId}` }, (payload: any) => {
					const newRow = payload.new;
					setSessions((prev) => {
						// avoid duplicates
						if (prev.some((s) => s.id === newRow.id)) return prev;
						return [newRow, ...prev];
					});
				})
				.subscribe();
			chanRef = chan;
		};
		setupSubscription();

		return () => {
			mounted = false;
			try { chanRef?.unsubscribe(); } catch { console.log('failed to unsubscribe')}
		};
	}, [teamId, accessToken]);
	console.log("teamid: ", teamId);
	console.log("sessions: ", sessions);
	return <div className='border-r min-w-1/5'>
			<h3 className='font-semibold text-xl border-b p-5'>Recent Chats</h3>
			<div>
			{sessions.map((session) => <ChatList key={session.id} chatName={"testing"} onClick={() => router.push(`/chat/${teamId}/${session.id}`)}/>)}
			</div>
		</div>
}
