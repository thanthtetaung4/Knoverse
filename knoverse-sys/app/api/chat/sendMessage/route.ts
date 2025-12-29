import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
	const { message, sessionId } = await request.json();
	console.log('Received message:', message, 'for sessionId:', sessionId);
	try {
		const pythonServerBase = process.env.PY_SERVER_URL ?? '';
		const pythonEndpoint = `${pythonServerBase.replace(/\/$/, '')}/chat`;
		const pythonResp = await fetch(pythonEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message, sessionId }),
		});
		console.log('Python server response status:', pythonResp.status);
	} catch (error: unknown) {
		return NextResponse.json({ error: 'Error sending message to Python server', details: error }, { status: 500 });
	}

	return NextResponse.json({ message: 'Message sent to Python server successfully' });
}
