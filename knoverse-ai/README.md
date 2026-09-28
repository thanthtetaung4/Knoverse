# knoverse-ai

FastAPI service that indexes team PDFs into Pinecone and answers chat questions with RAG over Ollama.
Only the Next.js server (`knoverse-sys`) calls it. Every request except `/health` must send the
shared secret in the `X-Internal-Token` header.

## Endpoints

| Method | Path | Body | What it does |
| --- | --- | --- | --- |
| `GET` | `/health` | – | Liveness check (no token needed) |
| `POST` | `/uploadFile` | `{ fileName, teamId, fileId }` | Downloads `fileName` from the Supabase `files` bucket to a temp file, indexes it with `team_id`/`file_id` metadata, then deletes the temp file |
| `POST` | `/chat` | `{ message, sessionId, teamId }` | Answers from the team's documents plus recent history, and stores both messages in `chat_messages` |
| `DELETE` | `/deleteFile` | `{ fileId }` | Removes the file's vectors from Pinecone |

Uploaded PDFs are only on disk while they are being indexed. They are written to
`<tmp>/knoverse-uploads/` and deleted afterwards whether indexing succeeds or fails. Anything
left behind by a crash is cleared the next time the service starts.

## Setup

Requires [uv](https://docs.astral.sh/uv/) and a running [Ollama](https://ollama.com).

```bash
cp .env.example .env   # fill in Supabase, Pinecone and AI_SERVICE_TOKEN
uv sync
uv run uvicorn app:app --reload --port 8000
```

On startup the service pulls `OLLAMA_EMBEDDING_MODEL` and `OLLAMA_LLM_MODEL` into Ollama if they
are missing. It creates the Pinecone index (768-dim, cosine) the first time a file is uploaded.

## Development

```bash
uv run pytest     # tests
uv run ruff check app.py config.py chat_ai.py ollama_models.py pinecone_file_upload.py pinecone_file_delete.py tests
```

## Layout

```
app.py                   FastAPI app, auth, temp-file handling
config.py                environment configuration
chat_ai.py               RAG chain, chat history, session naming
ollama_models.py         pulls required Ollama models once
pinecone_file_upload.py  PDF -> chunks -> embeddings -> Pinecone
pinecone_file_delete.py  delete a file's vectors
tests/                   pytest suite
```
