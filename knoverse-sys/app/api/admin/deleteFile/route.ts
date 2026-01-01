import { checkAuth } from '@/lib/auth/checkAuth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { teamFiles } from '@/supabase/migrations/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

async function supabaseDeleteFile(fileId: string, filePath: string) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
	const supabase = createClient(supabaseUrl, supabaseKey);

	console.log('Deleting file with fileId:', fileId);
	const result = await db.delete(teamFiles).where(eq(teamFiles.objectId, fileId));
	if (result.count === 0) {
		throw new Error('No team file record found to delete');
	}
	console.log('Delete result:', result[0]);
	console.log('Deleting file from Supabase with fileId:', filePath);
	const { data, error } = await supabase
		.storage
		.from('files')
		.remove([filePath]);
	console.log('Supabase delete response data:', data);

	if (error) {
		console.log('File delete error from Supabase:', error);
		throw error;
	}

	return data;
}

/*
* this route upload the file to the supabase storage
* and call the python server to vectorize the file
*
*/
export async function DELETE(request: NextRequest) {
	const formData = await request.formData();
	const authHeader = request.headers.get('Authorization')
	const accessToken = authHeader?.replace('Bearer ', '')
	const fileId = formData.get('fileId') as string | null;
	const filePath = formData.get('filePath') as string | null; // assuming filePath is same as fileId for deletion

	console.log('Received fileId:', fileId);
	if (!accessToken) {
		return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
	}

	console.log(accessToken)
	// Check authentication
	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return NextResponse.json({ error: authResult.error }, { status: 401 });
	}


	if (!fileId) {
		return NextResponse.json({ error: 'No fileId provided' }, { status: 400 });
	}

	// Upload file to Supabase Storage
	try {
		const deleteResponse = await supabaseDeleteFile(fileId, filePath!);
		console.log('File deleted from Supabase at path:', deleteResponse);
	} catch (error: unknown) {
		return NextResponse.json({ error: 'File delete failed', details: error }, { status: 500 });
	}

	try {
		// Call Python server to vectorize the file
		const pythonServerBase = process.env.PY_SERVER_URL ?? 'http://localhost:8000';
		const pythonEndpoint = `${pythonServerBase.replace(/\/$/, '')}/deleteFile`;

		const pythonResp = await fetch(pythonEndpoint, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileId: fileId }),
		});

		if (!pythonResp.ok) {
			const txt = await pythonResp.text().catch(() => '');
			return NextResponse.json({ error: 'Python server error', details: txt }, { status: 500 });
		}

		const pythonJson = await pythonResp.json().catch(() => ({}));
		console.log('Python server response:', pythonJson);
	} catch (error: unknown) {
		console.error('Error calling python server:', error);
		return NextResponse.json({ error: 'Failed to call python server', details: String(error) }, { status: 500 });
	}

	return (NextResponse.json({ message: `deleted successfully` }));
}
