'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider';
import { IoSend } from "react-icons/io5";
import { createClient } from '@/lib/supabase/client';
import Message from '@/components/message';
import { sendMessage } from '../page';


function MainChat({ sessionId }: { sessionId?: string}) {
	const [message, setMessage] = useState<string>("");
	const [messages, setMessages] = useState<any[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const { accessToken } = useUser();
	const params = useParams();
	const teamId = (params as any)?.teamId;
	const [sending, setSending] = useState<boolean>(false);
	const router = useRouter();

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
		}
	}, [message]);

	useEffect(() => {
		if (!sessionId) return;
		let mounted = true;
		const fetchHistory = async () => {
			try {
				const res = await fetch(`/api/chat/getChatHistory/?chatSessionId=${sessionId}`, {
					headers: { Authorization: `Bearer ${accessToken}` },
				});
				const json = await res.json();
				if (mounted) setMessages(Array.isArray(json?.chatHistory) ? json.chatHistory : []);
			} catch (err) {
				console.error('Error loading chat history', err);
			}
		};
		fetchHistory();

		// subscribe to new messages
		let chanRef: any = null;
		const setupSubscription = async () => {
			const supabase = createClient();
			const chan = supabase
				.channel(`public:chat_messages:session=${sessionId}`)
				.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_session_id=eq.${sessionId}` }, (payload: any) => {
					const newRow = payload.new;
					setMessages((prev) => [...prev, newRow]);
				})
				.subscribe();
			chanRef = chan;
		};
		setupSubscription();

		return () => {
			mounted = false;
			try { chanRef?.unsubscribe(); } catch {}
		};
	}, [sessionId, accessToken]);
	console.log(messages)
	return (
		<div className='w-full p-5 flex flex-col'>
			<div className='overflow-auto h-[90vh] w-full mb-4 px-30'>
				{messages.map((m) =>
					<Message key={ m.id } content={m.content} role={ m.role} />
				)}
			</div>
			<div className='flex justify-center items-center '>
				<div className='border w-3/4 px-3 rounded-full flex items-center'>
					<textarea
						ref={textareaRef}
						value={message}
						placeholder='Ask me anything'
						onChange={(e) => setMessage(e.target.value)}
						rows={1}
						className='min-h-13 h-auto w-full p-4 resize-none overflow-hidden outline-none focus:outline-none focus:ring-0 focus:border-transparent'
					/>
					<IoSend onClick={() => sendMessage({ sending, message, teamId, sessionId, setSending, setMessage, accessToken, router })} className={`mr-3 ${sending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} size={20}/>
				</div>
			</div>
		</div>
	);
}
export default function ChatPage() {
  const params = useParams();
  const sessionId = (params as any)?.sessionId;
	return <MainChat sessionId={sessionId} />
}
