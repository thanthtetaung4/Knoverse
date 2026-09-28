"""Index a PDF into Pinecone: load -> split -> embed with Ollama -> upsert.

Every chunk is tagged with team_id and file_id metadata, used for team-scoped
retrieval (chat_ai) and for deleting a file's vectors (pinecone_file_delete).
"""

import sys
import threading
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec

import config

_index_lock = threading.Lock()
_index_ready = False


def initialize_pinecone() -> str:
    """Create the Pinecone index if it doesn't exist (checked once per process)."""
    global _index_ready
    if _index_ready:
        return config.PINECONE_INDEX_NAME

    with _index_lock:
        if not _index_ready:
            pc = Pinecone(api_key=config.PINECONE_API_KEY)
            if not pc.has_index(config.PINECONE_INDEX_NAME):
                print(f"Creating Pinecone index: {config.PINECONE_INDEX_NAME}")
                pc.create_index(
                    name=config.PINECONE_INDEX_NAME,
                    dimension=768,  # nomic-embed-text uses 768 dimensions
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region=config.PINECONE_ENVIRONMENT),
                )
            _index_ready = True

    return config.PINECONE_INDEX_NAME


def load_and_split_pdf(pdf_path: str, team_id: str, file_id: str) -> List[Document]:
    """Load PDF and split into chunks tagged with team_id / file_id."""
    documents = PyPDFLoader(pdf_path).load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = text_splitter.split_documents(documents)
    for chunk in chunks:
        chunk.metadata["team_id"] = team_id
        chunk.metadata["file_id"] = file_id

    print(f"Loaded {len(documents)} pages, split into {len(chunks)} chunks")
    return chunks


def create_embeddings() -> OllamaEmbeddings:
    return OllamaEmbeddings(model=config.OLLAMA_EMBEDDING_MODEL, base_url=config.OLLAMA_BASE_URL)


def uploadFile(path: str, team_id: str, file_id: str) -> int:
    """Index the PDF at `path` for `team_id`. Returns the number of chunks upserted."""
    if not config.PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY not set in environment variables")

    index_name = initialize_pinecone()
    chunks = load_and_split_pdf(path, team_id, file_id)
    if not chunks:
        raise ValueError("No extractable text found in PDF")

    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=create_embeddings(),
        index_name=index_name,
        namespace=config.PINECONE_NAMESPACE,
    )
    print(f"Uploaded {len(chunks)} chunks for file {file_id} to Pinecone")
    return len(chunks)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("usage: python pinecone_file_upload.py <pdf_path> <team_id> <file_id>")
    uploadFile(sys.argv[1], sys.argv[2], sys.argv[3])
