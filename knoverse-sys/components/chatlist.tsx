import { IoChatboxEllipses } from "react-icons/io5";

export default function ChatList({ chatName, onClick }: { chatName: string, onClick?:  React.MouseEventHandler<HTMLDivElement>}) {
	return <div className="flex justify-start items-center h-10 gap-3 p-5 hover:bg-accent" onClick={onClick}>
		<IoChatboxEllipses size={16} />
		<p>{chatName}</p>
	</div>
}
