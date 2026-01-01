'use client'
import { getAccessToken } from "@/lib/auth/getAccessToken";

export default function fileUploadPage() {
	const handleFileDelete = async (fileId: string, filePath: string) => {
		const formData = new FormData();
		formData.append('fileId', fileId);
		formData.append('filePath', filePath); // assuming filePath is same as fileId for deletion

		const token = await getAccessToken();
		const res = await fetch('/api/admin/deleteFile', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`
			},
			body: formData
		}).catch((err) => {
			console.error('File delete request failed', err);
		});
		if (!res?.ok) {
			console.error('File delete failed', await res?.text());
		} else {
			console.log('File deleted successfully');
		}
		alert('File delete request sent. Check console for details.');
	}
	return (
		<div>
			<h1>File Delete Page</h1>
			<button onClick={() => handleFileDelete('941cae7d-7ace-433e-8cd4-257e31486a9b','abccommerce SDA.pdf')}>
				Delete File
			</button>
		</div>
	);
}
