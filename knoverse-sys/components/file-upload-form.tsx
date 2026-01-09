'use client'

import React, { useRef, useState } from "react";
import { getAccessToken } from "@/lib/auth/getAccessToken";

export default function FileUploadForm() {
	const [teamId, setTeamId] = useState<string>("");
	const [fileName, setFileName] = useState<string>("");
	const [isUploading, setIsUploading] = useState<boolean>(false);

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const uploadFile = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsUploading(true);
		const formData = new FormData(e.currentTarget);
		const teamId = formData.get("teamId") as string;
		const fileUpload = formData.get("fileUpload") as File;

		if (!teamId || !fileUpload) {
			alert("Please provide both Team ID and a file to upload.");
			return;
		}

		try {
			const token = await getAccessToken();
			const headers: Record<string, string> = {};
			if (token) headers['Authorization'] = `Bearer ${token}`;

			const response = await fetch("/api/admin/uploadFile", {
				headers,
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Upload failed: ${errorText}`);
			}

			alert("File uploaded successfully!");
			// clear file input and local state
			setFileName("");
			if (fileInputRef.current) fileInputRef.current.value = "";
		} catch (error: unknown) {
			alert(
				error instanceof Error
					? `Error uploading file: ${error.message}`
					: "An unknown error occurred during file upload."
			);
		}
		setIsUploading(false);
	}

	const form = (
		<form onSubmit={uploadFile}>
			<label>Team ID:</label>
			<input type="text" name="teamId" placeholder="Team ID" value={teamId} onChange={(e) => setTeamId(e.target.value)}/>
			<br />
			<label>File Upload:</label>
			<input ref={fileInputRef} type="file" name="fileUpload" onChange={(e) => setFileName(e.target.files ? e.target.files[0].name : "")} />
			{fileName && <div style={{ marginTop: 8 }}>Selected file: {fileName}</div>}
			<br />
			<button type="submit" disabled={isUploading}>Upload File</button>
		</form>
	)
	return (<>{form}</>)
}
