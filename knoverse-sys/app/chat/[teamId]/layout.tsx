import { ChatSideBar } from '@/components/chat-sidebar';
export default function ChatLayout({ children, }: { children: React.ReactNode; })
{
	return <div className='flex h-full border rounded-3xl overflow-hidden'>
			<ChatSideBar/>
			{children}
		</div>
}
