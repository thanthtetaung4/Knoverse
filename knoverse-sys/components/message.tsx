interface MessageProps {
	content: string;
	role: string;
}

export default function Message({content, role} : MessageProps) {
	return (
		<div className={`mb-2 flex ${role === "user" ? "text-right justify-end": "text-left"}`}>
			<p className={`bg-accent p-3 rounded-2xl ${role === "user" ? "rounded-br-none": "rounded-bl-none"} w-auto max-w-1/2`}>{content}</p>
		</div>
	)
}
