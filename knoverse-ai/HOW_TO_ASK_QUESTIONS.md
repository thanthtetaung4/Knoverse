# How to Ask Questions About Your PDF - Complete Guide

## 🎯 Three Ways to Use It

### Way 1: Run the Simple Example (Fastest)

```bash
source venv/bin/activate
python simple_example.py
```

**Output:**

```
Setting up embeddings...
Connecting to Pinecone...
Initializing LLM...

❓ Question: What are the payment methods?
💡 Answer: According to the document, the payment methods available are:
1. Visa
2. MasterCard
3. Affinity Card
4. American Express cards
5. Online payment methods (e.g., PayPal)
```

✓ Best for: Quick testing, batch processing

### Way 2: Interactive Q&A (Full Featured)

```bash
source venv/bin/activate
python ask_pdf.py
```

**Usage:**

```
❓ Ask a question: What is the limitation of liability?
⏳ Generating answer...

💡 Answer:
To the maximum extent permitted by applicable law...

📚 Sources:
  1. Page 7:
     To the maximum extent permitted by applicable law...
```

✓ Best for: Exploring documents, natural conversation

### Way 3: Command Line Batch

```bash
source venv/bin/activate
python ask_pdf.py "What payment methods?" "How to refund?" "Who owns what?"
```

✓ Best for: Automation, scripting

## 📚 How It Works Under the Hood

```
┌─────────────────┐
│  Your Question  │
│ "How to pay?"   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ OllamaEmbeddings    │  ← Convert question to vector
│ nomic-embed-text    │  ← 768-dimensional vector
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Pinecone Search     │  ← Find 3 most similar chunks
│ k=3 results         │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Retrieved Context   │  ← Relevant PDF sections
│ "Payments can be... │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Ollama LLM          │  ← Read context + generate answer
│ llama3 model        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Answer + Sources    │
│ "You can pay via... │
└─────────────────────┘
```

## 🔧 How to Customize

### In `simple_example.py`

Change these lines:

```python
# Change the model
llm = Ollama(model="llama3")  # Try: "mistral", "neural-chat"

# Get more chunks for context
retriever = vector_store.as_retriever(search_kwargs={"k": 5})

# Modify the prompt
template = """Based on this context:
{context}

Question: {question}

Provide a brief answer in 2 sentences maximum."""
```

### In `.env` file

```env
# Change which LLM to use
OLLAMA_LLM_MODEL=llama3

# Change embedding model (if you download another)
OLLAMA_MODEL=nomic-embed-text

# Change Pinecone index
PINECONE_INDEX_NAME=knoverse-index
```

## 💡 Code Example: Build Your Own

### Simple Version (10 lines)

```python
from langchain_community.embeddings import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

embeddings = OllamaEmbeddings(model="nomic-embed-text")
vs = PineconeVectorStore(index_name="knoverse-index", embedding=embeddings)
llm = Ollama(model="llama3")
retriever = vs.as_retriever(search_kwargs={"k": 3})

template = "Context: {context}\n\nQuestion: {question}\n\nAnswer:"
prompt = PromptTemplate.from_template(template)

chain = (
    {"context": retriever | (lambda docs: "\n\n".join(d.page_content for d in docs)),
     "question": lambda x: x}
    | prompt
    | llm
)

print(chain.invoke("What are payment methods?"))
```

### Advanced Version (Custom Control)

```python
from langchain_community.embeddings import OllamaEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.llms import Ollama

embeddings = OllamaEmbeddings(model="nomic-embed-text")
vs = PineconeVectorStore(index_name="knoverse-index", embedding=embeddings)
llm = Ollama(model="llama3", temperature=0.7)
retriever = vs.as_retriever(search_kwargs={"k": 5})

def ask_with_sources(question):
    # Get similar docs
    docs = retriever.invoke(question)

    # Build prompt
    context = "\n\n".join(d.page_content for d in docs)
    prompt = f"""Based on this context:
{context}

Question: {question}

Answer:"""

    # Generate answer
    answer = llm.invoke(prompt)

    return {
        "answer": answer,
        "sources": [d.metadata.get("page") for d in docs]
    }

result = ask_with_sources("How to refund?")
print(result["answer"])
print(f"Found on pages: {result['sources']}")
```

## 🎓 Available Models

### Embedding Models

- `nomic-embed-text` ✓ Installed - **RECOMMENDED**
- `all-MiniLM-L6-v2` - Smaller, faster
- `bge-base-en-v1.5` - Better quality

### LLM Models (for generation)

```bash
ollama pull llama3          # Recommended - 8B model
ollama pull mistral         # Fast and capable
ollama pull neural-chat     # Optimized for chat
ollama pull orca-mini       # Very fast, smaller
```

## ⚙️ Tuning for Your Needs

### For Speed

```python
# Use fewer chunks
retriever = vs.as_retriever(search_kwargs={"k": 1})

# Use smaller model
llm = Ollama(model="orca-mini")

# Reduce context length
template = "Q: {question}\n\nBased on: {context}\n\nA:"
```

### For Quality

```python
# Use more chunks
retriever = vs.as_retriever(search_kwargs={"k": 5})

# Use better model
llm = Ollama(model="llama3")

# Better prompt
template = """You are an expert at answering questions about this document.

Context:
{context}

Question: {question}

Provide a detailed, accurate answer:"""
```

### For Cost (if using cloud)

```python
# Fewer API calls
retriever = vs.as_retriever(search_kwargs={"k": 2})

# Batch questions
questions = ["Q1?", "Q2?", "Q3?"]
for q in questions:
    answer = chain.invoke(q)
```

## 🐛 Troubleshooting

| Problem              | Solution                                |
| -------------------- | --------------------------------------- |
| "No results"         | Run `python main.py` to index PDF first |
| "Connection refused" | Run `ollama serve` in another terminal  |
| "Model not found"    | Run `ollama pull llama3`                |
| "Slow responses"     | Use `orca-mini` instead or reduce `k`   |
| "Bad answers"        | Use `llama3` instead or increase `k`    |

## 📊 Real Examples

### Customer Support Bot

```python
questions = [
    "How do I cancel?",
    "What's your refund policy?",
    "Can I change my payment method?",
]

for q in questions:
    print(f"Q: {q}")
    print(f"A: {chain.invoke(q)}\n")
```

### Document Summarizer

```python
# Get all chunks and ask for summary
template = """Summarize this document in 3 bullet points:

{context}"""

# Change k to retrieve all chunks
retriever = vs.as_retriever(search_kwargs={"k": 30})
summary = chain.invoke("summarize")
```

### FAQ Generator

```python
questions = [
    "What are the terms?",
    "How do I pay?",
    "What's the refund policy?",
    "How do I cancel?",
    "Who can use this?",
]

faq = {}
for q in questions:
    faq[q] = chain.invoke(q)

# Save as FAQ
import json
with open("faq.json", "w") as f:
    json.dump(faq, f, indent=2)
```

## 📖 Files Reference

| File                 | Purpose                        | Use Case          |
| -------------------- | ------------------------------ | ----------------- |
| `simple_example.py`  | 40-line working example        | Learning, testing |
| `ask_pdf.py`         | Full-featured interactive tool | Daily use, demos  |
| `query_documents.py` | Search only (no generation)    | Simple retrieval  |
| `RAG_GUIDE.md`       | This guide                     | Reference         |

## 🎯 Next Steps

1. ✓ Run `python simple_example.py` - See it work
2. Run `python ask_pdf.py` - Try interactive mode
3. Modify `simple_example.py` - Customize prompts
4. Add more PDFs - `python main.py` with new files
5. Build a web app - Use Flask/FastAPI + `ask_pdf.py`

## 🚀 Deploying Your Q&A Bot

### As a Web API

```python
from flask import Flask, request, jsonify
from langchain_pinecone import PineconeVectorStore
# ... setup code ...

app = Flask(__name__)

@app.route("/ask", methods=["POST"])
def ask():
    question = request.json["question"]
    answer = chain.invoke(question)
    return jsonify({"answer": answer})

if __name__ == "__main__":
    app.run()
```

### As a Telegram Bot

```python
from telegram.ext import Application, CommandHandler

async def ask_command(update, context):
    question = " ".join(context.args)
    answer = chain.invoke(question)
    await update.message.reply_text(answer)

app = Application.builder().token("YOUR_TOKEN").build()
app.add_handler(CommandHandler("ask", ask_command))
```

---

**You're ready! Ask your PDF questions now! 🎉**

```bash
python ask_pdf.py
```
