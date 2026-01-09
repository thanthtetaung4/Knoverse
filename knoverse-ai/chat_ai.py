import os, requests
from dotenv import load_dotenv
from supabase import create_client, Client

"""Chat interface that uses a RAG chain (Ollama embeddings + Pinecone) to answer
user messages. Chat history is loaded from Supabase and formatted into turns.

Design notes:
- LangChain / Ollama imports are lazy (inside create_rag_chain) to keep module import
  fast and avoid heavy imports when the function isn't used.
"""


def format_chat_history_from_supabase(rows):
    """Convert Supabase rows (list of {role, content}) into a list of turns used by
    the prompt: [{"question": ..., "answer": ...}, ...].

    We pair user messages with the following assistant message when possible.
    """
    if not rows:
        return []

    turns = []
    # Ensure rows are in chronological order (oldest first). If Supabase returns
    # differently, adjust the ordering here.
    for row in rows:
        role = (row.get("role") or "").lower()
        content = row.get("content") or ""
        if role == "user":
            turns.append({"question": content, "answer": ""})
        elif role in ("assistant", "bot"):
            # Attach assistant content to the last user turn if present
            if turns and turns[-1].get("answer") == "":
                turns[-1]["answer"] = content
            else:
                # No preceding user message; append as an assistant-only turn
                turns.append({"question": "", "answer": content})
        else:
            # Unknown role: record as user by default
            turns.append({"question": content, "answer": ""})

    return turns


def create_rag_chain(team_id: str):
    """Lazily create and return a RAG chain (rag_chain, retriever).

    This imports the heavy dependencies only when needed.
    """
    # Local imports to avoid requiring heavy deps on module import
    from langchain_community.embeddings import OllamaEmbeddings
    from langchain_pinecone import PineconeVectorStore
    from langchain_community.llms import Ollama
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    load_dotenv()
    PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "knoverse-index")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "nomic-embed-text")
    OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:1b")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "ollama:11434")

    PROMPT_TEMPLATE = """You are a helpful assistant for Q&A over PDFs.
You must use the context and recent chat history to answer.
If you don't know the answer, say you don't know.

Chat history (most recent first):
{chat_history}

Context:
{context}

Question: {question}

Answer:"""

    embeddings = OllamaEmbeddings(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)

    vector_store = PineconeVectorStore(
        index_name=PINECONE_INDEX_NAME,
        embedding=embeddings,
        namespace="pdf-documents",
    )

    llm = Ollama(model=OLLAMA_LLM_MODEL, base_url=OLLAMA_BASE_URL, temperature=0.0)

    retriever = vector_store.as_retriever(search_kwargs={
        "filter": {
            "team_id": team_id
        }
    })

    prompt = PromptTemplate.from_template(PROMPT_TEMPLATE)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {
            "context": retriever | format_docs,
            "question": lambda x: x["question"],
            "chat_history": lambda x: x["chat_history"],
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain, retriever


def session_name_gen(user_message: str) -> str:
    """Generate a short, descriptive session name from the user's message using Ollama.

    Returns a concise title (max ~50 chars) suitable for display in a session list.
    Falls back to truncating the message if Ollama fails.
    """
    load_dotenv()
    OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:1b")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "ollama:11434")

    try:
        from langchain_community.llms import Ollama

        llm = Ollama(model=OLLAMA_LLM_MODEL, base_url=OLLAMA_BASE_URL, temperature=0.3)

        prompt = f"""Generate a very short, descriptive title (max 6 words) for a chat session that starts with this message.
Return ONLY the title, nothing else. No quotes, no explanation, no punctuation at the end.

User message: {user_message[:500]}

Title:"""

        response = llm.invoke(prompt)
        # Clean up the response
        title = response.strip().strip('"\'').strip()
        # Remove trailing punctuation
        title = title.rstrip(".,!?;:")
        # Truncate if too long
        if len(title) > 50:
            title = title[:47] + "..."
        if title:
            return title
    except Exception as e:
        print(f"Warning: Ollama session name generation failed: {e}")

    # Fallback: truncate the user message
    fallback = user_message.strip().splitlines()[0][:50].strip()
    return fallback if fallback else "New Chat"

def ensure_ollama_model(model: str):
    
    print(model)
    load_dotenv()
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "ollama:11434")
    # Check installed models
    tags = requests.get(f"{OLLAMA_BASE_URL}/api/tags").json().get("models", [])
    print(tags)
    installed = {m["name"] for m in tags}
    # print(requests.get(f"{OLLAMA_BASE_URL}").json())
    
    if model in installed:
        return

    print(f"📥 Pulling Ollama model: {model}")
    r = requests.post(
        f"{OLLAMA_BASE_URL}/api/pull",
        json={"name": model},
        # stream=True,
        timeout=None,
    )
    r.raise_for_status()
    print(f"{OLLAMA_BASE_URL}/api/pull")
    print(r.status_code)

def chat(user_message: str, chat_session: str, team_id: str) -> str:
    """Main chat entrypoint.

    - Loads chat history for `chat_session` from Supabase
    - Builds a RAG chain lazily and invokes it with the user's question and history
    - Returns the assistant's answer as a string
    """
    load_dotenv()
    
    OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
    OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:1b")

    ensure_ollama_model(OLLAMA_EMBEDDING_MODEL)
    ensure_ollama_model(OLLAMA_LLM_MODEL)

    url: str = os.getenv("SUPABASE_URL", "").strip()
    key: str = os.getenv("SUPABASE_KEY")

    if url and not url.endswith("/"):
        url = url + "/"

    supabase: Client = create_client(url, key)

    # Check if session has a name, if null generate one using Ollama
    try:
        session_resp = supabase.from_("chat_sessions").select("session_name").eq("id", chat_session).maybe_single().execute()
        session_row = getattr(session_resp, "data", None) or session_resp
        current_name = None
        if session_row and isinstance(session_row, dict):
            current_name = session_row.get("session_name")
        
        # If session_name is null/empty, generate one and update DB
        if not current_name or not str(current_name).strip():
            generated_name = session_name_gen(user_message)
            print(f"Generated session name: {generated_name}")
            print(f"Updating session name in DB for session {chat_session}")
            supabase.from_("chat_sessions").update({"session_name": generated_name}).eq("id", chat_session).execute()
    except Exception as e:
        print(f"Warning: Failed to check/update session name: {e}")

    # Fetch chat messages for the session (role, content). We expect the table
    # `chat_messages` to contain a `chat_session_id` column.
    try:
        resp = supabase.from_("chat_messages").select("role", "content").eq("chat_session_id", chat_session).execute()
        rows = resp.data if resp and hasattr(resp, "data") else []
    except Exception as e:
        # On failure to query history, proceed with empty history but log the error
        print(f"Failed to load chat history from Supabase: {e}")
        rows = []

    chat_history = format_chat_history_from_supabase(rows)

    # Build the RAG chain and retriever
    rag_chain, retriever = create_rag_chain(team_id)

    # The rag_chain expects a dict with keys question and chat_history
    payload = {"question": user_message, "chat_history": chat_history}

    # Invoke the chain to get an answer
    try:
        # answer = "hello"
        answer = rag_chain.invoke(payload)
    except Exception as e:
        # Bubble up a readable error
        raise RuntimeError(f"RAG chain invocation failed: {e}")

    # Optionally: store the new user message and assistant response back to Supabase
    try:
        supabase.from_("chat_messages").insert([
            {"chat_session_id": chat_session, "role": "user", "content": user_message},
            {"chat_session_id": chat_session, "role": "assistant", "content": answer},
        ]).execute()
    except Exception as e:
        print(f"Failed to persist chat messages to Supabase: {e}")

    return answer


if __name__ == "__main__":
    # quick smoke test: ensure module imports and chat function are callable
    # print("chat callable:", callable(chat))
    print("chat('Hello', 'e2b07688-2243-4069-8dce-69cf45a26905') =", chat("hi my name is Alex", "e82c2983-d3dc-4ff7-9f0a-03e6fe1e5512", "d6495449-c24a-401b-af7d-707d882be162"))
