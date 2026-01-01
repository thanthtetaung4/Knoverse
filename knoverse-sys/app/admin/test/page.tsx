'use client';
import { getAccessToken } from "@/lib/auth/getAccessToken";
import { useEffect, useState } from "react";


export default function Test() {
	const [token, setToken] = useState<string | null>(null);
	const [teamId, setTeamId] = useState<string | null>(null);

	useEffect(() => {
		const fetchToken = async () => {
			const tok = await getAccessToken();
			setToken(tok ?? null);
		}
		fetchToken();
	}, [])


	const handleGetTeam = async (token: string | null)=> {
		const res = await fetch('/api/admin/deleteFile', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`
			},
		}).catch((err) => {
			console.error('Fetching Teams request failed', err);
		});
		if (!res?.ok) {
			console.error('Fetching Teams failed', await res?.text());
		} else {
			console.log('Teams fetched successfully');
		}
	}

	const handlePostTeam = async (token: string | null, teamName: string, description: string) => {
		const formData = new FormData();
		formData.append('teamName', teamName);
		formData.append('description', description);
		const res = await fetch('/api/admin/deleteFile', {
			method: "POST",
			headers: {
				'Authorization': `Bearer ${token}`
			},
			body: formData,
		}).catch((err) => {
			console.error('Creat Team request failed', err);
		});
		if (!res?.ok){
			console.error('Creating Teams failed', await res?.text());
		} else {
			console.log('Team created successfully');
		}
	}

	const handleDeleteTeam = async (token: string | null, teamId: string) => {
		const formData = new FormData();
		formData.append('teamId', teamId);
		const res = await fetch('/api/admin/deleteFile', {
			method: "POST",
			headers: {
				'Authorization': `Bearer ${token}`
			},
			body: formData,
		}).catch((err) => {
			console.error('Creat Team request failed', err);
		});
		if (!res?.ok){
			console.error('Creating Teams failed', await res?.text());
		} else {
			console.log('Team created successfully');
		}
	}

	return (<>
			<div>Admin Test Page</div>

			<button onClick={() => handleGetTeam(token)}>GET TEAMS</button>
			<button onClick={() => handlePostTeam(token, "new team", "test team")}>CREATE TEAM</button>
			<button onClick={() => handleDeleteTeam(token, "")}>CREATE TEAM</button>
		</>)
}
