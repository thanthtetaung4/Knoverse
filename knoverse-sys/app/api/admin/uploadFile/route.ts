import { checkAuth } from '@/lib/auth/checkAuth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/db';
import { teamFiles } from '@/db/schema';

async function supabaseUploadFile(teamId: string, file: File) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
	const supabase = createClient(supabaseUrl, supabaseKey);

	const { data, error } = await supabase
		.storage
		.from('files')
		.upload(file.name, file);
	// use this to create team file data?.id;
	if (error) {
		throw error;
	}
	const result  = await db.insert(teamFiles).values({teamId: teamId, objectId: data.id});
	if (!result) {
		throw new Error('Failed to insert team file record');
	}
	return data;
}

/*
* this route upload the file to the supabase storage
* and call the python server to vectorize the file
*
*/
export async function POST(request: NextRequest) {
	const authHeader = request.headers.get('Authorization')
	const accessToken = authHeader?.replace('Bearer ', '')
	const { file, teamId } = await request.json();

	if (!accessToken) {
		return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
	}

	console.log(accessToken)
	// Check authentication
	const authResult = await checkAuth(accessToken);
	if (!authResult.success) {
		return NextResponse.json({ error: authResult.error }, { status: 401 });
	}

	if (!file) {
		return NextResponse.json({ error: 'No file provided' }, { status: 400 });
	}
	if (!teamId) {
		return NextResponse.json({ error: 'No teamId provided' }, { status: 400 });
	}

	let filePath = '';
	let fileId = '';
	// Upload file to Supabase Storage
	try {
		const uploadResponse = await supabaseUploadFile(teamId, file);
		filePath = uploadResponse.path
		fileId = uploadResponse.id;
		console.log('File uploaded to Supabase at path:', filePath);
	} catch (error: unknown) {
		return NextResponse.json({ error: 'File upload failed', details: error }, { status: 500 });
	}

	try {
		// Call Python server to vectorize the file
		const pythonServerBase = process.env.PY_SERVER_URL ?? 'http://localhost:8000';
		const pythonEndpoint = `${pythonServerBase.replace(/\/$/, '')}/uploadFile`;

		const pythonResp = await fetch(pythonEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileName: filePath, teamId: teamId, fileId: fileId }),
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
	console.log('file: ', file.name, ',', file.type, 'teamId: ', teamId);

	return (NextResponse.json({ message: `File ${filePath} uploaded successfully` }));
}
