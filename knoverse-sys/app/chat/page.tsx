'use client';
import { useState } from 'react';

export default function ChatPage() {
	const [text, setText] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		const formData = new FormData(e.currentTarget);
		const message = formData.get('message');

		try {
			const response = await fetch('/api/chat/sendMessage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message, sessionId: "e2b07688-2243-4069-8dce-69cf45a26905", teamId: "2285d04b-98c9-4a1e-9276-941f5cd77d67" }),
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
			<button type="submit" disabled={loading}>{loading ? "Sending..." : "Send"}</button>
		</form>
		</>)
}
