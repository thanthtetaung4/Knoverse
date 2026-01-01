import os
import string
from dotenv import load_dotenv
from typing import List
import sys

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore

# Pinecone imports
from pinecone import Pinecone
from pinecone import ServerlessSpec

# Load environment variables
load_dotenv()

# Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "knoverse-index")


def delete_file_from_pinecone(file_id: str):
    # Defensive checks and clearer debug for list_indexes returning None
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY is not set in environment variables")

    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
    except Exception as e:
        # If client construction fails, raise with context
        raise RuntimeError(f"Failed to instantiate Pinecone client: {e}")

    # Debug: show the client repr (helps detect import/version conflicts)
    print(f"Pinecone client: {repr(pc)}")

    try:
        index_list = pc.list_indexes()
    except Exception as e:
        # Provide the raw exception which often contains HTTP status / auth info
        raise RuntimeError(f"pc.list_indexes() raised an exception: {e}")

    # Debug: show the returned value
    print(f"pc.list_indexes() -> {repr(index_list)}")

    # Backwards-compatible checks: some clients return None on error
    if index_list is None:
        raise RuntimeError("pc.list_indexes() returned None - check PINECONE_API_KEY, network access, and installed pinecone package versions.")

    # index_list is expected to have an .indexes list or be an iterable of names
    try:
        index_names = [idx.name for idx in index_list.indexes] if hasattr(index_list, "indexes") else list(index_list)
    except Exception:
        # Fall back to trying to treat the response as a sequence of names
        try:
            index_names = list(index_list)
        except Exception as e:
            raise RuntimeError(f"Unable to parse pc.list_indexes() result: {e}")

    if PINECONE_INDEX_NAME not in index_names:
        raise ValueError(f"Pinecone index {PINECONE_INDEX_NAME} does not exist. Available indexes: {index_names}")

    # Get a handle to the actual index and delete matching vectors
    pine_index = pc.Index(PINECONE_INDEX_NAME)

    pine_index.delete(
        filter={
            "file_id": file_id  # Replace with the actual file_id to delete
        },
        namespace="pdf-documents"
    )

    print(f"Deleted entries with file_id {file_id} from Pinecone index.")

if __name__ == "__main__":
    # Example usage
    test_file_id = "796dda70-dcda-4ba2-8fae-3a4306836155"
    delete_file_from_pinecone(test_file_id)