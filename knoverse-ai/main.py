"""
Example: Upload PDF indexes to Pinecone using Ollama embeddings and LangChain
This script demonstrates the full workflow of:
1. Loading a PDF document
2. Splitting text into chunks
3. Creating embeddings using Ollama
4. Uploading to Pinecone vector database
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from typing import List

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
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "nomic-embed-text")  # or "mistral", "neural-chat"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
PDF_PATH = "pdf/sample-terms-conditions-agreement.pdf"

# Chunk configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def initialize_pinecone() -> str:
    """Initialize Pinecone and create index if it doesn't exist."""
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Check if index exists
    existing_indexes = pc.list_indexes()
    index_names = [index.name for index in existing_indexes.indexes] if existing_indexes.indexes else []

    if PINECONE_INDEX_NAME not in index_names:
        print(f"Creating Pinecone index: {PINECONE_INDEX_NAME}")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=768,  # nomic-embed-text uses 768 dimensions
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region=PINECONE_ENVIRONMENT)
        )
        print(f"Index {PINECONE_INDEX_NAME} created successfully!")
    else:
        print(f"Index {PINECONE_INDEX_NAME} already exists")

    return PINECONE_INDEX_NAME


def load_and_split_pdf(pdf_path: str) -> List:
    """Load PDF and split into chunks."""
    print(f"\nLoading PDF from: {pdf_path}")

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found at {pdf_path}")

    # Load PDF
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    print(f"Loaded {len(documents)} pages from PDF")

    # Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks")

    return chunks


def create_embeddings():
    """Create embedding instance using Ollama."""
    print(f"\nInitializing Ollama embeddings with model: {OLLAMA_MODEL}")
    embeddings = OllamaEmbeddings(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL
    )
    return embeddings


def upload_to_pinecone(chunks: List, embeddings, index_name: str):
    """Upload document chunks to Pinecone."""
    print(f"\nUploading {len(chunks)} chunks to Pinecone index: {index_name}")

    # Create vector store and upload
    vector_store = PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=index_name,
        namespace="pdf-documents"  # Optional: organize by namespace
    )

    print(f"Successfully uploaded {len(chunks)} chunks to Pinecone!")
    return vector_store


def main():
    """Main workflow: Load PDF -> Create embeddings -> Upload to Pinecone."""
    try:
        # Validate configuration
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY not set in environment variables")

        print("=" * 60)
        print("PDF to Pinecone Indexing Pipeline")
        print("=" * 60)

        # Step 1: Initialize Pinecone
        index_name = initialize_pinecone()

        # Step 2: Load and split PDF
        chunks = load_and_split_pdf(PDF_PATH)

        # Step 3: Create embeddings using Ollama
        embeddings = create_embeddings()

        # Step 4: Upload to Pinecone
        vector_store = upload_to_pinecone(chunks, embeddings, index_name)

        print("\n" + "=" * 60)
        print("Pipeline completed successfully!")
        print("=" * 60)

        # Optional: Test retrieval
        print("\nTesting retrieval...")
        test_query = "terms and conditions"
        results = vector_store.similarity_search(test_query, k=3)
        print(f"\nTop 3 results for query '{test_query}':")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. Score: {result.metadata.get('score', 'N/A')}")
            print(f"   Content: {result.page_content[:200]}...")

    except Exception as e:
        print(f"\nError: {str(e)}")
        raise


if __name__ == "__main__":
    main()
