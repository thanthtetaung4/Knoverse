# PDF to Pinecone Indexing Pipeline

This project demonstrates how to upload PDF document indexes to Pinecone using Ollama embeddings and LangChain.

## Features

- 📄 **PDF Loading**: Extract text from PDF documents using LangChain
- 🧩 **Text Chunking**: Split documents into manageable chunks with overlap
- 🤖 **Ollama Embeddings**: Generate embeddings using local Ollama models
- 📌 **Pinecone Storage**: Store and retrieve vectors from Pinecone
- 🔍 **Similarity Search**: Query stored vectors for semantic search

## Prerequisites

### 1. Install Ollama

Download and install Ollama from [ollama.ai](https://ollama.ai)

### 2. Pull an Embedding Model

```bash
ollama pull nomic-embed-text
# or other supported models:
# ollama pull neural-chat
# ollama pull mistral
```

Start Ollama server (usually runs on localhost:11434):

```bash
ollama serve
```

### 3. Pinecone Account

- Create an account at [pinecone.io](https://pinecone.io)
- Get your API key from the dashboard
- Note your environment (e.g., `us-east-1`)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PINECONE_API_KEY=your_api_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=knoverse-index
OLLAMA_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. Verify Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

## Usage

Run the pipeline:

```bash
python main.py
```

### What the Script Does

1. **Initializes Pinecone**: Creates an index if it doesn't exist
2. **Loads PDF**: Reads the sample PDF document
3. **Chunks Text**: Splits document into 1000-token chunks with 200-token overlap
4. **Generates Embeddings**: Uses Ollama to create vector embeddings
5. **Uploads to Pinecone**: Stores chunks and embeddings in the vector database
6. **Tests Retrieval**: Performs a sample similarity search to verify the setup

## Key Components

### OllamaEmbeddings

```python
embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://localhost:11434"
)
```

### PDF Loading & Chunking

```python
loader = PyPDFLoader("path/to/pdf.pdf")
documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
chunks = text_splitter.split_documents(documents)
```

### Pinecone Upload

```python
vector_store = PineconeVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_name="knoverse-index",
    namespace="pdf-documents"
)
```

### Similarity Search

```python
results = vector_store.similarity_search("your query", k=3)
```

## Supported Ollama Models for Embeddings

- **nomic-embed-text** (recommended) - 768 dimensions, 137M parameters
- **neural-chat** - Good for general purpose
- **mistral** - Larger model, more capable

## Troubleshooting

### "Connection refused" errors

- Ensure Ollama is running: `ollama serve`
- Check Ollama is accessible: `curl http://localhost:11434/api/tags`

### "PINECONE_API_KEY not set"

- Verify `.env` file exists and contains your API key
- Make sure you're running from the project directory

### "Index creation failed"

- Check Pinecone API key is valid
- Ensure your environment variable matches your Pinecone region

### PDF loading errors

- Verify the PDF file exists in the `pdf/` directory
- Ensure PDF is not corrupted or encrypted

## Project Structure

```
knoverse-ai/
├── main.py                              # Main pipeline script
├── pdf/
│   └── sample-terms-conditions-agreement.pdf
├── requirements.txt                     # Python dependencies
├── .env                                 # Environment variables (local)
├── .env.example                         # Template for .env
└── README.md                            # This file
```

## Performance Tips

1. **Chunk Size**: Larger chunks = fewer API calls but less granular search
2. **Overlap**: Prevents losing context at chunk boundaries
3. **Namespace**: Use namespaces to organize different PDF batches
4. **Batch Processing**: Process multiple PDFs in a loop to optimize

## Example: Processing Multiple PDFs

```python
pdf_directory = "pdf/"
for pdf_file in os.listdir(pdf_directory):
    if pdf_file.endswith(".pdf"):
        print(f"Processing {pdf_file}...")
        chunks = load_and_split_pdf(f"{pdf_directory}{pdf_file}")
        embeddings = create_embeddings()
        upload_to_pinecone(chunks, embeddings, PINECONE_INDEX_NAME)
```

## Next Steps

1. **Implement RAG**: Use the indexed vectors for Retrieval-Augmented Generation
2. **Add Query Interface**: Build a chat interface using LangChain
3. **Multiple Data Sources**: Extend to process web pages, databases, etc.
4. **Filter Queries**: Use metadata filtering for advanced searches

## References

- [LangChain Documentation](https://python.langchain.com)
- [Pinecone Documentation](https://docs.pinecone.io)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [LangChain Pinecone Integration](https://python.langchain.com/docs/integrations/vectorstores/pinecone)

## License

MIT
