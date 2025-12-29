import { useState } from 'react';

export default function ChatPage() {
	const [text, setText] = useState<string>("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const message = formData.get('message');

		try {
			const response = await fetch('/api/chat/sendMessage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message }),
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
	}
	return (<>
		<form onSubmit={handleSubmit}>
			<label>Enter your message:</label>
			<input
				type="text"
				name="message"
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Type your message here"
			/>
			<button type="submit">Send</button>
		</form>
		</>)
}
