"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { useUser } from '@/app/providers/UserProvider';

export default function SettingsPageCard() {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [password, setPassword] = useState<string>('');
	const { accessToken } = useUser();

	const handlePwdChange = async () => {
		setLoading(true);
		setError(null);
		setMessage(null);
		try {
			const res = await fetch('/api/update-password', {
				method: 'POST',
        		headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({ password }),
			});
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				setError(json?.error ?? 'Failed to send reset email');
			} else {
				setMessage(json?.message ?? 'Password reset email sent');
			}
		} catch (err: unknown) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm">New Password</label>
			<input
				type="text"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="New Password"
				className="px-3 py-2 border rounded"
			/>
			<Button onClick={handlePwdChange} disabled={loading || !password}>
				{loading ? 'Sending…' : 'Send Password Reset Email'}
			</Button>
			{message && <p className="text-sm text-green-600">{message}</p>}
			{error && <p className="text-sm text-red-600">{error}</p>}
		</div>
	);
}
