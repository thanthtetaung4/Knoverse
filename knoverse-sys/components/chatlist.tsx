import { IoChatboxEllipses } from "react-icons/io5";

export default function ChatList({ chatName }: { chatName: string }) {
	return <div className="flex justify-start items-center h-10 gap-3 p-5 hover:bg-accent">
		<IoChatboxEllipses size={16} />
		<p>{chatName}</p>
	</div>
}
