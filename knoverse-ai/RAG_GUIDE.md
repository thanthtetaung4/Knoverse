# Using LangChain + Ollama to Ask Questions About Your PDF

This guide shows you how to build a **Q&A system** that answers questions about your indexed PDF.

## 🎯 How It Works

```
Your Question
      ↓
[Ollama Embeddings] - converts question to vector
      ↓
[Pinecone Search] - finds 3 most relevant chunks
      ↓
[Retrieved Context] - gets the relevant PDF sections
      ↓
[Ollama LLM] - reads context + generates answer
      ↓
Final Answer with Sources
```

## 🚀 Quick Start (3 Ways)

### Method 1: Simple Python Script (Easiest)

```bash
# Make sure you have a generation model
ollama pull mistral

# Run simple example
source venv/bin/activate
python simple_example.py
```

Output:

```
Answer: The payment methods include Visa, MasterCard, American Express, and PayPal...

Answer: To the maximum extent permitted by law, the company shall not be liable...

Answer: Users can terminate their account by...
```

### Method 2: Interactive Q&A (Full Featured)

```bash
source venv/bin/activate
python ask_pdf.py
```

Then type questions:

```
❓ Ask a question: What are the terms and conditions?
⏳ Generating answer...

💡 Answer: The terms and conditions outline...

📚 Sources:
  1. Page 1:
     Sample Terms and Conditions Template...
```

### Method 3: Command Line Questions

```bash
source venv/bin/activate
python ask_pdf.py "What is the refund policy?" "How do I make a payment?"
```

## 📚 Understanding the Code

### The Core Components

**1. Embeddings** (find relevant docs)

```python
from langchain_community.embeddings import OllamaEmbeddings

embeddings = OllamaEmbeddings(model="nomic-embed-text")
# Converts text to 768-dimensional vectors
```

**2. Vector Store** (retrieve from Pinecone)

```python
from langchain_pinecone import PineconeVectorStore

vector_store = PineconeVectorStore(
    index_name="knoverse-index",
    embedding=embeddings
)

# Get most similar documents
docs = vector_store.similarity_search("payment terms", k=3)
```

**3. LLM** (generate answers)

```python
from langchain_community.llms import Ollama

llm = Ollama(model="mistral")
# Answers questions based on context
```

**4. RetrievalQA Chain** (put it together)

```python
from langchain.chains import RetrievalQA

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_store.as_retriever(search_kwargs={"k": 3})
)

answer = qa_chain.run("Your question here")
```

## 🎓 Examples

### Example 1: Basic Q&A

```python
qa_chain = RetrievalQA.from_chain_type(llm, "stuff", retriever)

# Ask questions
print(qa_chain.run("What are the terms?"))
print(qa_chain.run("How do I pay?"))
```

### Example 2: With Source Documents

```python
result = qa_chain({"query": "What is liability?"})

answer = result["result"]  # The answer
sources = result["source_documents"]  # Where it came from

for doc in sources:
    print(doc.page_content)
    print(doc.metadata["page"])
```

### Example 3: Custom Prompt

```python
from langchain.prompts import PromptTemplate

template = """Answer based on this context:
{context}

Question: {question}

Be concise and cite the section."""

prompt = PromptTemplate(
    template=template,
    input_variables=["context", "question"]
)

qa_chain = RetrievalQA.from_chain_type(
    llm,
    chain_type="stuff",
    retriever=vector_store.as_retriever(),
    chain_type_kwargs={"prompt": prompt}
)
```

### Example 4: Multiple Retrievals

```python
# Get top 5 most relevant chunks instead of 3
retriever = vector_store.as_retriever(search_kwargs={"k": 5})

qa_chain = RetrievalQA.from_chain_type(
    llm,
    chain_type="stuff",
    retriever=retriever
)
```

## 🔧 Available Ollama Models

### For Embeddings (Already Installed)

- `nomic-embed-text` (768 dims) - **BEST** - already installed ✓

### For Generation (Download one)

```bash
# Fast & good quality
ollama pull mistral

# Or try these
ollama pull neural-chat     # Optimized for chat
ollama pull llama2          # Meta's model
ollama pull orca-mini       # Smaller, faster
```

Then set in `.env`:

```env
OLLAMA_LLM_MODEL=mistral
```

## 🛠️ Troubleshooting

### "Model not found"

```bash
# Download the model
ollama pull mistral

# Or set to an available model
# Run this to see what you have:
ollama list
```

### "Connection refused"

```bash
# Make sure Ollama is running
ollama serve

# In another terminal, test it
curl http://localhost:11434/api/tags
```

### "No results found"

- Your PDF might not be indexed
- Run `python main.py` first
- Then run `python verify_setup.py`

### Slow responses

- Use a smaller model (e.g., `orca-mini`)
- Reduce `k` in `search_kwargs={"k": 3}`
- Use GPU acceleration if available

## 📊 Performance Tips

### Speed Up Responses

```python
# Use fewer chunks
retriever = vector_store.as_retriever(search_kwargs={"k": 1})

# Use faster model
llm = Ollama(model="neural-chat")

# Reduce context
from langchain.chains import stuff
```

### Improve Answer Quality

```python
# Use more chunks
retriever = vector_store.as_retriever(search_kwargs={"k": 5})

# Use better model
llm = Ollama(model="mistral")

# Better prompts
# (see Example 3 above)
```

## 🎯 What Each File Does

| File                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| `ask_pdf.py`         | Full-featured interactive Q&A system    |
| `simple_example.py`  | Minimal working example (10 lines!)     |
| `query_documents.py` | Search (no generation) - just retrieval |
| `main.py`            | Indexing (loads PDF to Pinecone)        |

## 💡 Real-World Example

```python
# Build a customer support bot
from langchain_community.embeddings import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA

# Setup
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vs = PineconeVectorStore(index_name="knoverse-index", embedding=embeddings)
llm = Ollama(model="mistral")
qa = RetrievalQA.from_chain_type(llm, "stuff", vs.as_retriever())

# Usage
customer_questions = [
    "What payment methods do you accept?",
    "Can I cancel my subscription?",
    "What's your refund policy?",
    "How do I contact support?",
]

for q in customer_questions:
    print(f"Q: {q}")
    print(f"A: {qa.run(q)}\n")
```

## 🔄 Chain Types

LangChain supports different chain types:

### `stuff` (Default - Recommended)

- All context fed to LLM at once
- Fast, good for small docs
- ✓ Best for our use case

### `map_reduce`

- Summarizes each chunk separately
- Good for large amounts of text
- Slower but handles more content

### `refine`

- Iteratively refines answer
- Better quality but slower
- Use for critical questions

```python
# Try different chain types
for chain_type in ["stuff", "map_reduce", "refine"]:
    qa = RetrievalQA.from_chain_type(
        llm,
        chain_type=chain_type,
        retriever=retriever
    )
    print(f"{chain_type}: {qa.run(question)}")
```

## 📞 Next Steps

1. ✓ Run `python simple_example.py` - see it work
2. Run `python ask_pdf.py` - try interactive mode
3. Add more PDFs - expand your knowledge base
4. Build a web interface - deploy as a service
5. Integrate with your app - add RAG to your product

## 🎓 Learning Resources

- [LangChain RetrievalQA](https://python.langchain.com/docs/modules/chains/popular/qa_with_sources)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Pinecone Integration](https://docs.pinecone.io/guides/integrations)
- [RAG Architecture](https://towardsdatascience.com/retrieval-augmented-generation-rag-from-theory-to-langchain-implementation)

---

**Ready to ask your PDF questions?** 🚀

```bash
source venv/bin/activate
python ask_pdf.py
```
