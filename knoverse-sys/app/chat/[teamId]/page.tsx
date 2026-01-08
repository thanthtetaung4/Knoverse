'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider';
import { IoSend } from "react-icons/io5";
import { SetStateAction } from 'react';
import { useMessageSend } from "@/app/providers/MessageSendProvider";

export interface SendMessageProps {
	sending: boolean;
	message: string;
	teamId: string;
	setSending: React.Dispatch<SetStateAction<boolean>>
	setMessage: React.Dispatch<SetStateAction<string>>
	accessToken: string | null;
	sessionId?: string;
	router: ReturnType<typeof useRouter>;
	setMessageSend?: (value: boolean) => void;
}
 export async function sendMessage({sending, message, teamId, sessionId, setSending, setMessage, setMessageSend, accessToken, router}:SendMessageProps) {


	if (sending) return;
	const text = (message ?? "").toString().trim();
	if (!text) return;
	if (!teamId) return alert('Missing team id');
	setSending(true);
	try {
		const response = await fetch('/api/chat/sendMessage', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message: text, sessionId: sessionId ?? null, teamId }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText || 'Message send failed');
		}
		if (setMessageSend) setMessageSend(true);
		const json = await response.json();
		if (!json?.sessionId) throw new Error('Missing sessionId in response');
		router.push(`/chat/${teamId}/${json.sessionId}`);
		setMessage("");
	} catch (err: unknown) {
		alert(err instanceof Error ? `Error sending message: ${err.message}` : 'Unknown error');
	} finally {
		setSending(false);
	}
};

function MainChat() {
	const [message, setMessage] = useState<string>("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const { accessToken } = useUser();
	const params = useParams();
	const teamId = (params as any)?.teamId;
	const [sending, setSending] = useState<boolean>(false);
	const router = useRouter();
	const { messageSend, setMessageSend } = useMessageSend();

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
		}
	}, [message]);

	return (
		<div className='w-full -mt-30 p-5 flex flex-col'>
			<div className='my-auto flex flex-col gap-10 justify-center items-center'>
				<h3 className='text-3xl'>What the fuck u want?</h3>
				<div className='border w-1/2 px-3 rounded-full flex items-center'>
					<textarea
						ref={textareaRef}
						value={message}
						placeholder='Ask me anything'
						onChange={(e) => setMessage(e.target.value)}
						rows={1}
						className='min-h-13 h-auto w-full p-4 resize-none overflow-hidden outline-none focus:outline-none focus:ring-0 focus:border-transparent'
					/>
					<IoSend onClick={() => sendMessage({ sending, message, teamId, setSending, setMessage, setMessageSend, accessToken, router })} className={`mr-3 ${sending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} size={20}/>
				</div>
			</div>
		</div>
	);
}
export default function ChatPage() {
	return <MainChat/>
}
