'use client';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '../providers/UserProvider';
import ChatList from '@/components/chatlist';
import { IoSend } from "react-icons/io5";

function MainChat() {
	const [message, setMessage] = useState<string>("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
		}
	}, [message]);

	return (
		<div className='w-full -mt-30 p-5 flex flex-col'>
			<div className='my-auto flex flex-col gap-10 justify-center items-center'>
				<h3 className='text-3xl'>Hi there how can I help you today?</h3>
				<div className='border w-1/2 px-3 rounded-full flex items-center'>
					<textarea
						ref={textareaRef}
						value={message}
						placeholder='Ask me anything'
						onChange={(e) => setMessage(e.target.value)}
						rows={1}
						className='min-h-13 h-auto w-full p-4 resize-none overflow-hidden outline-none focus:outline-none focus:ring-0 focus:border-transparent'
					/>
					<IoSend className='mr-3' size={20}/>
				</div>
			</div>
		</div>
	);
}
export default function ChatPage() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { accessToken } = useUser();
  // const {user} = useUser()
  // console.log("user: ", user)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const message = formData.get("message");

    try {
      const response = await fetch("/api/chat/sendMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId: null,
          teamId: "2285d04b-98c9-4a1e-9276-941f5cd77d67",
        }),
      });

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Message send failed: ${errorText}`);
			}
		} catch (error: unknown) {
			alert(
				error instanceof Error
					? `Error sending message: ${error.message}`
					: "An unknown error occurred while sending the message."
			);
		}
		setLoading(false);
	}
	return (
		<div className='flex h-full border rounded-3xl overflow-hidden'>
			<MainChat/>
		</div>)
}
