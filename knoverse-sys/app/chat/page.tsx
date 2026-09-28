'use client';
import { useEffect, useRef, useState } from 'react';
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
	return (
		<div className='flex h-full border rounded-3xl overflow-hidden'>
			<MainChat/>
		</div>)
}
