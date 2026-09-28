import os
import secrets
import tempfile
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

import config
import chat_ai as chat
import ollama_models
import pinecone_file_delete as pfd
import pinecone_file_upload as pfu

# Downloaded PDFs live here only while they are being indexed.
UPLOAD_TMP_DIR = Path(tempfile.gettempdir()) / "knoverse-uploads"
STALE_UPLOAD_SECONDS = 60 * 60


def sweep_file(path: Path) -> None:
    """Delete a temporary upload; never raises."""
    try:
        path.unlink(missing_ok=True)
    except OSError as e:
        print(f"Warning: failed to sweep temp upload {path}: {e}")


def sweep_stale_uploads() -> None:
    """Remove temp uploads left behind by a crash or restart mid-indexing."""
    if not UPLOAD_TMP_DIR.exists():
        return
    cutoff = time.time() - STALE_UPLOAD_SECONDS
    for path in UPLOAD_TMP_DIR.glob("*.pdf"):
        try:
            if path.stat().st_mtime < cutoff:
                sweep_file(path)
        except FileNotFoundError:
            pass


def _warm_up_models() -> None:
    try:
        ollama_models.ensure_models()
    except Exception as e:
        # Not fatal: chat() retries on first use.
        print(f"Warning: could not prepare Ollama models at startup: {e}")


@asynccontextmanager
async def lifespan(_: FastAPI):
    UPLOAD_TMP_DIR.mkdir(parents=True, exist_ok=True)
    sweep_stale_uploads()
    # Pulling models can take minutes; don't block the server from starting.
    threading.Thread(target=_warm_up_models, daemon=True).start()
    yield


app = FastAPI(lifespan=lifespan)


def verify_internal_token(x_internal_token: Optional[str] = Header(default=None)) -> None:
    """Only the Next.js server (which holds AI_SERVICE_TOKEN) may call this service."""
    if not config.AI_SERVICE_TOKEN:
        raise HTTPException(status_code=500, detail="AI_SERVICE_TOKEN is not configured")
    if not x_internal_token or not secrets.compare_digest(x_internal_token, config.AI_SERVICE_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid internal token")


def error(message: str, status_code: int) -> JSONResponse:
    return JSONResponse({"status": "error", "message": message}, status_code=status_code)


class UploadFileRequest(BaseModel):
    fileName: Optional[str] = None
    teamId: Optional[str] = None
    fileId: Optional[str] = None


class ChatRequest(BaseModel):
    message: Optional[str] = None
    sessionId: Optional[str] = None
    teamId: Optional[str] = None


class DeleteFileRequest(BaseModel):
    fileId: Optional[str] = None


# Handlers are plain `def` (not `async def`) so FastAPI runs them in a threadpool;
# the Supabase, Pinecone and Ollama calls below are all blocking.

@app.get('/health')
def health_check():
    return JSONResponse({"status": "ok"}, status_code=200)


@app.post('/uploadFile', dependencies=[Depends(verify_internal_token)])
def upload_file_endpoint(body: UploadFileRequest):
    if not body.fileName or not body.teamId or not body.fileId:
        return error("fileName, teamId and fileId are required", 400)

    print(f"Downloading file {body.fileName} from Supabase storage")
    try:
        response = chat.get_supabase().storage.from_(config.SUPABASE_BUCKET).download(body.fileName)
    except Exception as e:
        # Return a clear error if the storage call fails (404/400 etc.)
        return error(f"Storage download failed: {e}", 502)

    # response may be bytes, an httpx.Response-like object, or a file-like object
    if isinstance(response, (bytes, bytearray)):
        data = bytes(response)
    elif hasattr(response, "content"):
        data = response.content
    elif hasattr(response, "read"):
        data = response.read()
    else:
        return error("Unable to read storage response", 502)

    # Write to a server-chosen temp path (never a path derived from the request),
    # index it, then sweep it whether indexing succeeded or not.
    UPLOAD_TMP_DIR.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(suffix=".pdf", dir=UPLOAD_TMP_DIR)
    tmp_path = Path(tmp_name)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        chunks = pfu.uploadFile(str(tmp_path), body.teamId, body.fileId)
        return JSONResponse(
            {"status": "success", "message": f"File {body.fileName} uploaded successfully.", "chunks": chunks},
            status_code=200,
        )
    except Exception as e:
        return error(str(e), 500)
    finally:
        sweep_file(tmp_path)


@app.post('/chat', dependencies=[Depends(verify_internal_token)])
def chat_endpoint(body: ChatRequest):
    if not body.message or not body.sessionId or not body.teamId:
        return error("message, sessionId and teamId are required", 400)
    try:
        chat.chat(body.message, body.sessionId, body.teamId)
        return JSONResponse({"status": "success"}, status_code=200)
    except Exception as e:
        return error(str(e), 500)


@app.delete('/deleteFile', dependencies=[Depends(verify_internal_token)])
def delete_file_endpoint(body: DeleteFileRequest):
    if not body.fileId:
        return error("fileId is required", 400)
    try:
        pfd.delete_file_from_pinecone(body.fileId)
        return JSONResponse({"status": "success", "message": f"File with ID {body.fileId} deleted successfully."}, status_code=200)
    except Exception as e:
        return error(str(e), 500)


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
