"""Single place for the AI service's environment configuration."""

import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "files")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "knoverse-index")
PINECONE_NAMESPACE = "pdf-documents"

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
# OLLAMA_MODEL is the old name for the embedding model; still honoured so existing .env files keep working.
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL") or os.getenv("OLLAMA_MODEL") or "nomic-embed-text"
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:1b")
OLLAMA_PULL_TIMEOUT = float(os.getenv("OLLAMA_PULL_TIMEOUT", "900"))

# Shared secret the Next.js server must send in the X-Internal-Token header.
AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN")

# How many previous question/answer turns are sent to the LLM.
CHAT_HISTORY_TURNS = int(os.getenv("CHAT_HISTORY_TURNS", "6"))

# Chunking for PDF ingestion
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def supabase_url() -> str:
    # Ensure storage endpoint has a trailing slash to avoid path join issues
    return SUPABASE_URL if not SUPABASE_URL or SUPABASE_URL.endswith("/") else SUPABASE_URL + "/"
