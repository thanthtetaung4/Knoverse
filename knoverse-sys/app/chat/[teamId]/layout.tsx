'use client';
import { ChatSideBar } from '@/components/chat-sidebar';
import { MessageSendProvider } from '@/app/providers/MessageSendProvider';
import React from 'react';

export default function ChatLayout({ children, }: { children: React.ReactNode; })
{
	return (
		<MessageSendProvider>
			<div className='flex h-full border rounded-3xl overflow-hidden'>
				<ChatSideBar/>
				{children}
			</div>
		</MessageSendProvider>
	)
}
