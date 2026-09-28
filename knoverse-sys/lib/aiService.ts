/**
 * Calls to the knoverse-ai (FastAPI) service. Every request carries the shared
 * AI_SERVICE_TOKEN so the AI service only accepts calls from this server.
 */
export async function callAiService(path: string, method: "POST" | "DELETE", body: unknown) {
  const base = process.env.PY_SERVER_URL;
  const token = process.env.AI_SERVICE_TOKEN;
  if (!base || !token) {
    throw new Error("PY_SERVER_URL and AI_SERVICE_TOKEN must be set");
  }

  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Internal-Token": token },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI service ${method} ${path} returned ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}
