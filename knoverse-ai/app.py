import os
import json
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from supabase import create_client, Client
import uvicorn
import pinecone_file_upload as pfu
import chat_ai as chat
import pinecone_file_delete as pfd

load_dotenv()
app = FastAPI()


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

@app.post('/uploadFile')
def upload_file_endpoint(body: UploadFileRequest):
    fileName = body.fileName
    teamId = body.teamId
    fileId = body.fileId
    # download the file from request from supabase storage
    url: str = os.getenv("SUPABASE_URL", "").strip()
    key: str = os.getenv("SUPABASE_KEY")

    # Ensure storage endpoint has a trailing slash to avoid path join issues
    if url and not url.endswith("/"):
        url = url + "/"

    supabase: Client = create_client(url, key)
    print(f"Downloading file {fileName} from Supabase storage")
    try:
        response = supabase.storage.from_("files").download(fileName)
    except Exception as e:
        # Return a clear error if the storage call fails (404/400 etc.)
        return JSONResponse({"status": "error", "message": f"Storage download failed: {str(e)}"}, status_code=502)

    # response may be bytes, an httpx.Response-like object, or a file-like object
    if isinstance(response, (bytes, bytearray)):
        data = response
    elif hasattr(response, "content"):
        data = response.content
    elif hasattr(response, "read"):
        data = response.read()
    else:
        # Fallback: try to JSON-encode whatever was returned
        try:
            data = json.dumps(response).encode("utf-8")
        except Exception:
            return JSONResponse({"status": "error", "message": "Unable to read storage response"}, status_code=502)

    with open(fileName, "wb") as f:
        f.write(data)
    try:
        pfu.uploadFile(fileName, teamId, fileId)
        return JSONResponse({"status": "success", "message": f"File {fileName} uploaded successfully."}, status_code=200)
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.post('/chat')
def char_endpoint(body: ChatRequest):
    user_message = body.message
    chat_session = body.sessionId
    team_id = body.teamId
    try:
        response_message = chat.chat(user_message, chat_session, team_id)
        print(f"Chat response: {response_message}")
        return JSONResponse({"status": "success"}, status_code=200)
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.delete('/deleteFile')
def delete_file_endpoint(body: DeleteFileRequest):
    file_id = body.fileId
    try:
        pfd.delete_file_from_pinecone(file_id)
        return JSONResponse({"status": "success", "message": f"File with ID {file_id} deleted successfully."}, status_code=200)
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
