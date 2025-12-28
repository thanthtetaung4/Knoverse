import { checkAuth } from '@/lib/auth/checkAuth'

// function buildFileUrl()

type VectorizeRequestBody = {
	authToken?: string
	fileId?: string
	fileUrl?: string
	teamId?: string
	fileName?: string
}

/*
* this function send the request to the python server to vectorize the file
* @param string: fileUrl, teamId, fileName, authToken
* @returns success: boolean, message: string
*/
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as VectorizeRequestBody

		const { authToken, fileId, fileUrl, teamId, fileName } = body

		if (!authToken) {
			return new Response(JSON.stringify({ error: 'Missing authToken' }), { status: 401 })
		}

		if (!fileId && !fileUrl) {
			return new Response(
				JSON.stringify({ error: 'Either fileId or fileUrl must be provided' }),
				{ status: 400 }
			)
		}

		if (!teamId) {
			return new Response(JSON.stringify({ error: 'Missing teamId' }), { status: 400 })
		}

		// Verify the access token (optional but recommended). checkAuth returns
		// the user id/email if valid. If you prefer to skip verification here and
		// let the python backend validate the token, you can remove this step.
		const authResult = await checkAuth(authToken)
		if (!authResult.success) {
			return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401 })
		}

		const pythonUrl = process.env.PYTHON_VECTORIZE_URL || process.env.PYTHON_BACKEND_URL
		if (!pythonUrl) {
			return new Response(JSON.stringify({ error: 'Python backend URL not configured' }), { status: 500 })
		}

		// Forward the request to the Python backend. We include the original
		// auth token in the Authorization header and pass the payload as JSON.
		const forwardBody = {
			fileId,
			fileUrl,
			teamId,
			fileName,
			userId: authResult.user.id,
			userEmail: authResult.user.email,
		}

		const resp = await fetch(pythonUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify(forwardBody),
		})

		const text = await resp.text()
		// Try to parse JSON, otherwise return text
		let data: unknown = text
			try {
				data = JSON.parse(text)
			} catch (e) {
				void e
				data = { message: text }
			}

		return new Response(JSON.stringify({ ok: resp.ok, status: resp.status, data }), {
			status: resp.ok ? 200 : resp.status,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		return new Response(JSON.stringify({ error: message }), { status: 500 })
	}
}
