import os
import json
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from supabase import create_client, Client
import pinecone_file_upload as pfu
import chat_ai as chat

load_dotenv()
app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/uploadFile', methods=['POST'])
def upload_file_endpoint():
    # Flask provides the request object from flask import request
    fileName: str = request.json.get('fileName')
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
        return jsonify({"status": "error", "message": f"Storage download failed: {str(e)}"}), 502

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
            return jsonify({"status": "error", "message": "Unable to read storage response"}), 502

    with open(fileName, "wb") as f:
        f.write(data)
    try:
        pfu.uploadFile(fileName)
        return jsonify({"status": "success", "message": f"File {fileName} uploaded successfully."}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/chat', methods=['POST'])
def char_endpoint():
    user_message: str = request.json.get('message')
    chat_session: str = request.json.get('sessionId')
    try:
        response_message = chat.chat(user_message, chat_session)
        print(f"Chat response: {response_message}")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500