"""
Simple example: Ask questions about PDF using LangChain + Ollama + Pinecone
This is the most straightforward way to get started
"""

import os
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Step 1: Create embeddings (for retrieving relevant chunks)
print("Setting up embeddings...")
embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://localhost:11434"
)

# Step 2: Connect to your Pinecone vector store (from main.py)
print("Connecting to Pinecone...")
vector_store = PineconeVectorStore(
    index_name="knoverse-index",
    embedding=embeddings,
    namespace="pdf-documents"
)

# Step 3: Create an LLM (for generating answers)
print("Initializing LLM...")
llm = Ollama(
    model="llama3",  # You can also use other models
    base_url="http://localhost:11434"
)

# Step 4: Create a simple RAG pipeline
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

template = """Based on the following context from the document, answer the question.

Context:
{context}

Question: {question}

Answer:"""

prompt = PromptTemplate.from_template(template)

# Define how to format documents
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Build RAG chain
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# Step 5: Ask questions!
print("\n" + "="*60)
questions = [
    "What are the payment methods?",
    "What is the limitation of liability?",
    "How can users terminate their account?"
]

for q in questions:
    print(f"\n❓ Question: {q}")
    answer = rag_chain.invoke(q)
    print(f"💡 Answer: {answer}\n")
