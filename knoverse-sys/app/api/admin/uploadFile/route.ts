import { checkAuth } from '@/lib/auth/checkAuth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function supabaseUploadFile(teamId: string, file: File) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
	const supabase = createClient(supabaseUrl, supabaseKey);

	const { data, error } = await supabase
		.storage
		.from('files')
		.upload(file.name, file);

	if (error) {
		throw error;
	}
	return data;
}

/*
* this route upload the file to the supabase storage
* and call the python server to vectorize the file
*
*/
export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const authHeader = request.headers.get('Authorization')
	const accessToken = authHeader?.replace('Bearer ', '')
	const file = formData.get('fileUpload') as File | null;
	const teamId = formData.get('teamId') as string | null;

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
	// Upload file to Supabase Storage
	try {
		const uploadResponse = await supabaseUploadFile(teamId, file);
		filePath = uploadResponse.fullPath;
	} catch (error: unknown) {
		return NextResponse.json({ error: 'File upload failed', details: error }, { status: 500 });
	} finally {

	}
	console.log('file: ', file.name, ',', file.type, 'teamId: ', teamId);

	return (NextResponse.json({ message: `File ${filePath} uploaded successfully` }));
}
