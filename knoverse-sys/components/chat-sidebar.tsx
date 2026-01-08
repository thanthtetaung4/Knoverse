"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import { useMessageSend } from "@/app/providers/MessageSendProvider";
import ChatList from "@/components/chatlist";
import { useParams, useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type SessionItem = {
	id: string;
	teamId: string;
	userId: string;
	createdAt: Date | null;
	name: string | null;
}

type Session = SessionItem[]


export function ChatSideBar() {
	const { accessToken } = useUser();
	const [sessions, setSessions] = useState<Session>([]);
	const params = useParams();
	const teamId = params?.teamId;
	const router = useRouter();
	const { messageSend, setMessageSend } = useMessageSend();

	// Fetch sessions when teamId changes or message is sent
	useEffect(() => {
		if (!teamId) return;
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

		return () => {
			mounted = false;
		};
	}, [teamId, accessToken, messageSend]);

	// Realtime subscription for new chat_sessions
	useEffect(() => {
		if (!teamId) return;
		
		const supabase = createClient();
		const channel = supabase
			.channel(`public:chat_sessions:team=${teamId}`)
			.on('postgres_changes', { 
				event: 'INSERT', 
				schema: 'public', 
				table: 'chat_sessions', 
				filter: `team_id=eq.${teamId}` 
			}, (payload) => {
				const newRow = payload.new as SessionItem;
				setSessions((prev) => {
					// avoid duplicates
					if (prev.some((s) => s.id === newRow.id)) return prev;
					return [newRow, ...prev];
				});
			})
			.subscribe();

		return () => {
			try { 
				channel.unsubscribe(); 
			} catch { 
				console.log('failed to unsubscribe');
			}
		};
	}, [teamId]);
	console.log("teamid: ", teamId);
	console.log("sessions: ", sessions);
	return <div className='border-r min-w-1/5'>
			<h3 className='font-semibold text-xl border-b p-5'>Recent Chats</h3>
			<div>
			{sessions.map((session) => <ChatList key={session.id} chatName={session.name ?? "Untitled"} onClick={() => router.push(`/chat/${teamId}/${session.id}`)}/>)}
			</div>
		</div>
}
