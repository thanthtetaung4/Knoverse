# Quick Reference Guide

## 🎯 Most Important Commands

### First Time Setup

```bash
cd /home/thant-htet-aung/knoverse/knoverse-ai
source venv/bin/activate
python verify_setup.py
```

### Run the Indexing Pipeline

```bash
source venv/bin/activate
python main.py
```

### Query Documents Interactively

```bash
source venv/bin/activate
python query_documents.py
```

### Query with Specific Questions

```bash
source venv/bin/activate
python query_documents.py "payment methods" "refund policy"
```

## 📋 File Guide

| File                 | Purpose                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `main.py`            | **Main pipeline** - loads PDF, chunks text, embeds with Ollama, uploads to Pinecone |
| `query_documents.py` | **Search tool** - interactive or batch search of indexed documents                  |
| `verify_setup.py`    | **Diagnostics** - checks Ollama, Pinecone, and PDF connections                      |
| `requirements.txt`   | **Dependencies** - all Python packages needed                                       |
| `.env`               | **Config** - your Pinecone API key (keep secret!)                                   |
| `.env.example`       | **Template** - copy this to create `.env`                                           |
| `README.md`          | **Full docs** - comprehensive setup and usage guide                                 |
| `SETUP_COMPLETE.md`  | **Status** - what was installed and next steps                                      |
| `setup.sh`           | **Auto setup** - automated initial setup script                                     |

## 🔧 Configuration

Your `.env` file should look like:

```env
PINECONE_API_KEY=pc_your_actual_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=knoverse-index
OLLAMA_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

## 🐛 Troubleshooting Checklist

- [ ] Ollama running? → Run `ollama serve` in another terminal
- [ ] `.env` file exists? → Check for `PINECONE_API_KEY`
- [ ] Virtual env activated? → Use `source venv/bin/activate`
- [ ] Verify setup? → Run `python verify_setup.py`

## 📊 System Status

✅ **All Components Working:**

- PDF loaded (9 pages → 29 chunks)
- Ollama embeddings (nomic-embed-text)
- Pinecone index created and populated
- Similarity search verified

## 🚀 Next: Build Your RAG Application

```python
from query_documents import initialize_vector_store
import json

# Get your vector store
vs = initialize_vector_store()

# Query it
docs = vs.similarity_search("your question", k=5)

# Build a prompt for LLM
context = "\n".join([d.page_content for d in docs])
prompt = f"Using this context:\n{context}\n\nAnswer: "
```

## 📚 Useful Links in This Project

- **LangChain Docs**: https://python.langchain.com
- **Pinecone API**: https://docs.pinecone.io
- **Ollama Models**: https://ollama.ai/library
- **PDF Extraction**: https://pypdf.readthedocs.io

## 💡 Pro Tips

1. **Large PDFs**: Reduce `CHUNK_SIZE` in main.py for smaller chunks
2. **Better Results**: Use a specialized embedding model (e.g., `all-MiniLM-L6-v2`)
3. **Namespace Organization**: Use different namespaces for different document types
4. **Metadata**: Add custom metadata when uploading for better filtering
5. **Batch Processing**: Process multiple PDFs in a loop

## ⚡ Performance Notes

- Ollama embedding generation: ~5-10s for 29 chunks
- Pinecone upload: ~2-3s
- Similarity search: <100ms
- Total time: ~10-15 seconds

## 📞 Support

All code includes detailed comments. Check the docstrings in:

- `main.py` - Understanding the pipeline
- `query_documents.py` - Query API
- `verify_setup.py` - Debugging

---

**You're all set! Happy indexing! 🎉**
