"""
Interactive query tool for searching indexed documents in Pinecone
Usage: python query_documents.py
"""

import os
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore

load_dotenv()

PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "knoverse-index")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "nomic-embed-text")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


def initialize_vector_store():
    """Initialize the vector store for queries."""
    embeddings = OllamaEmbeddings(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL
    )
    
    vector_store = PineconeVectorStore(
        index_name=PINECONE_INDEX_NAME,
        embedding=embeddings,
        namespace="pdf-documents"
    )
    
    return vector_store


def format_results(results, query):
    """Format search results for display."""
    print(f"\n{'='*60}")
    print(f"Search Results for: '{query}'")
    print(f"{'='*60}\n")
    
    if not results:
        print("No results found.")
        return
    
    for i, result in enumerate(results, 1):
        print(f"📄 Result {i}")
        print(f"   Content: {result.page_content[:200]}...")
        if hasattr(result, 'metadata') and result.metadata:
            print(f"   Metadata: {result.metadata}")
        print()


def interactive_search():
    """Interactive search loop."""
    print("\n" + "="*60)
    print("Document Search Tool")
    print("="*60)
    print("Initialize vector store...", end=" ", flush=True)
    
    try:
        vector_store = initialize_vector_store()
        print("✓")
    except Exception as e:
        print(f"✗\nError: {str(e)}")
        return
    
    print("\nTips:")
    print("- Enter natural language queries")
    print("- Type 'quit' or 'exit' to end")
    print("- Type 'help' for more options\n")
    
    while True:
        try:
            query = input("🔍 Enter your search query: ").strip()
            
            if not query:
                print("Please enter a query.")
                continue
            
            if query.lower() in ['quit', 'exit']:
                print("\nGoodbye!")
                break
            
            if query.lower() == 'help':
                print("\nAvailable commands:")
                print("  - Type any question to search documents")
                print("  - Type 'quit' to exit")
                print("  - Type 'exit' to exit")
                print()
                continue
            
            # Perform search
            results = vector_store.similarity_search(query, k=3)
            format_results(results, query)
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {str(e)}")
            continue


def batch_search(queries):
    """Search multiple queries at once."""
    print("Initializing vector store...")
    
    try:
        vector_store = initialize_vector_store()
    except Exception as e:
        print(f"Error: {str(e)}")
        return
    
    for query in queries:
        results = vector_store.similarity_search(query, k=3)
        format_results(results, query)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Batch search mode
        queries = sys.argv[1:]
        batch_search(queries)
    else:
        # Interactive mode
        interactive_search()
