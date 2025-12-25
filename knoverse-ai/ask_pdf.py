"""
RAG (Retrieval-Augmented Generation) Q&A System using Ollama and Pinecone
Asks questions about your indexed PDF documents
"""

import os
import sys
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Configuration
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "knoverse-index")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "nomic-embed-text")
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama3")  # For generation
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Custom prompt template for Q&A
PROMPT_TEMPLATE = """Based on the following context from the document, answer the question. 
If you don't know the answer, just say that you don't know.

Context:
{context}

Question: {question}

Answer:"""


def create_rag_chain():
    """Create a retrieval-augmented Q&A chain."""
    print("Initializing embeddings model...", end=" ", flush=True)
    embeddings = OllamaEmbeddings(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL
    )
    print("✓")
    
    print("Connecting to Pinecone vector store...", end=" ", flush=True)
    vector_store = PineconeVectorStore(
        index_name=PINECONE_INDEX_NAME,
        embedding=embeddings,
        namespace="pdf-documents"
    )
    print("✓")
    
    print(f"Initializing {OLLAMA_LLM_MODEL} LLM for generation...", end=" ", flush=True)
    llm = Ollama(
        model=OLLAMA_LLM_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=0.7
    )
    print("✓")
    
    # Create retriever
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    
    # Create prompt template
    prompt = PromptTemplate.from_template(PROMPT_TEMPLATE)
    
    # Format function for documents
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
    
    # Create RAG chain
    rag_chain = (
        {"context": retriever | format_docs, "question": lambda x: x}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    print("\n✓ RAG Chain initialized successfully!\n")
    return rag_chain, retriever


def ask_question(rag_chain, retriever, question):
    """Ask a question and get an answer with sources."""
    print(f"\n📝 Question: {question}")
    print("⏳ Generating answer...\n")
    
    # Get answer
    answer = rag_chain.invoke(question)
    print(f"💡 Answer:\n{answer}")
    
    # Get source documents
    docs = retriever.invoke(question)
    if docs:
        print("\n📚 Sources:")
        for i, doc in enumerate(docs, 1):
            page = doc.metadata.get("page", "Unknown")
            print(f"\n  {i}. Page {int(page) + 1}:")
            print(f"     {doc.page_content[:150]}...")


def interactive_qa():
    """Interactive Q&A session."""
    print("="*60)
    print("PDF Question Answering System")
    print("="*60)
    
    rag_chain, retriever = create_rag_chain()
    
    print("Tips:")
    print("- Ask natural language questions about the PDF")
    print("- Type 'quit' or 'exit' to end")
    print("- Type 'help' for examples\n")
    
    while True:
        try:
            question = input("❓ Ask a question: ").strip()
            
            if not question:
                print("Please enter a question.")
                continue
            
            if question.lower() in ['quit', 'exit']:
                print("\nGoodbye!")
                break
            
            if question.lower() == 'help':
                print("\n📖 Example questions:")
                print("  - What are the payment methods?")
                print("  - What is the limitation of liability?")
                print("  - How can I use this service?")
                print("  - What are the terms and conditions?")
                print()
                continue
            
            ask_question(rag_chain, retriever, question)
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {str(e)}")
            continue


def batch_qa(questions):
    """Answer multiple questions."""
    print("="*60)
    print("PDF Question Answering System - Batch Mode")
    print("="*60)
    
    rag_chain, retriever = create_rag_chain()
    
    for question in questions:
        ask_question(rag_chain, retriever, question)
        print("\n" + "="*60)


def interactive_qa():
    """Interactive Q&A session."""
    print("="*60)
    print("PDF Question Answering System")
    print("="*60)
    
    rag_chain, retriever = create_rag_chain()
    
    print("Tips:")
    print("- Ask natural language questions about the PDF")
    print("- Type 'quit' or 'exit' to end")
    print("- Type 'help' for examples\n")
    
    while True:
        try:
            question = input("❓ Ask a question: ").strip()
            
            if not question:
                print("Please enter a question.")
                continue
            
            if question.lower() in ['quit', 'exit']:
                print("\nGoodbye!")
                break
            
            if question.lower() == 'help':
                print("\n📖 Example questions:")
                print("  - What are the payment methods?")
                print("  - What is the limitation of liability?")
                print("  - How can I use this service?")
                print("  - What are the terms and conditions?")
                print()
                continue
            
            ask_question(rag_chain, retriever, question)
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {str(e)}")
            continue


def batch_qa(questions):
    """Answer multiple questions."""
    print("="*60)
    print("PDF Question Answering System - Batch Mode")
    print("="*60)
    
    rag_chain, retriever = create_rag_chain()
    
    for question in questions:
        ask_question(rag_chain, retriever, question)
        print("\n" + "="*60)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Batch mode: answer provided questions
        questions = sys.argv[1:]
        batch_qa(questions)
    else:
        # Interactive mode
        interactive_qa()
