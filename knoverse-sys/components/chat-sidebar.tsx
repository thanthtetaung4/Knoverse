"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import ChatList from "@/components/chatlist";
import { useParams, useRouter } from 'next/navigation';

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
		const fetchSessions = async () => {
			try {
				const response = await fetch(`/api/chat/getChatSession/?teamId=${teamId}`, {
					headers: {
					Authorization: `Bearer ${accessToken}`,
					},
				});
				const data = await response.json();
				setSessions(Array.isArray(data?.chatSession) ? data.chatSession : []);
			} catch (error) {
				console.error("Error fetching sessions:", error);
			}
		};
		fetchSessions();
	}, [teamId, accessToken]);

	return <div className='border-r min-w-1/5'>
			<h3 className='font-semibold text-xl border-b p-5'>Recent Chats</h3>
			<div>
			{sessions.map((session) => <ChatList key={session.id} chatName={"hello MFKs"} onClick={() => router.push(`/chat/${teamId}/${session.id}`)}/>)}
			</div>
		</div>
}
