"""Chat interface that uses a RAG chain (Ollama embeddings + Pinecone) to answer
user messages. Chat history is loaded from Supabase and formatted into turns.

The embeddings, LLM and vector store are built once per process and reused;
only the team-filtered retriever is created per request.
"""

from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_pinecone import PineconeVectorStore
from supabase import Client, create_client

import config
import ollama_models

PROMPT_TEMPLATE = """You are a helpful assistant for Q&A over PDFs.
You must use the context and recent chat history to answer.
If you don't know the answer, say you don't know.

Chat history (oldest first):
{chat_history}

Context:
{context}

Question: {question}

Answer:"""


def format_chat_history_from_supabase(rows):
    """Convert Supabase rows (list of {role, content}, oldest first) into turns:
    [{"question": ..., "answer": ...}, ...].

    We pair user messages with the following assistant message when possible.
    """
    if not rows:
        return []

    turns = []
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


def render_chat_history(turns) -> str:
    if not turns:
        return "(none)"
    lines = []
    for turn in turns:
        if turn["question"]:
            lines.append(f"User: {turn['question']}")
        if turn["answer"]:
            lines.append(f"Assistant: {turn['answer']}")
    return "\n".join(lines)


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    return create_client(config.supabase_url(), config.SUPABASE_KEY)


@lru_cache(maxsize=2)
def get_llm(temperature: float = 0.0) -> OllamaLLM:
    return OllamaLLM(model=config.OLLAMA_LLM_MODEL, base_url=config.OLLAMA_BASE_URL, temperature=temperature)


@lru_cache(maxsize=1)
def get_vector_store() -> PineconeVectorStore:
    embeddings = OllamaEmbeddings(model=config.OLLAMA_EMBEDDING_MODEL, base_url=config.OLLAMA_BASE_URL)
    return PineconeVectorStore(
        index_name=config.PINECONE_INDEX_NAME,
        embedding=embeddings,
        namespace=config.PINECONE_NAMESPACE,
        pinecone_api_key=config.PINECONE_API_KEY,
    )


def create_rag_chain(team_id: str):
    """Return (rag_chain, retriever) whose retrieval is restricted to `team_id`."""
    retriever = get_vector_store().as_retriever(search_kwargs={"filter": {"team_id": team_id}})
    prompt = PromptTemplate.from_template(PROMPT_TEMPLATE)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {
            "context": (lambda x: x["question"]) | retriever | format_docs,
            "question": lambda x: x["question"],
            "chat_history": lambda x: x["chat_history"],
        }
        | prompt
        | get_llm()
        | StrOutputParser()
    )

    return rag_chain, retriever


def session_name_gen(user_message: str) -> str:
    """Generate a short, descriptive session name from the user's message using Ollama.

    Returns a concise title (max ~50 chars) suitable for display in a session list.
    Falls back to truncating the message if Ollama fails.
    """
    try:
        prompt = f"""Generate a very short, descriptive title (max 6 words) for a chat session that starts with this message.
Return ONLY the title, nothing else. No quotes, no explanation, no punctuation at the end.

User message: {user_message[:500]}

Title:"""

        response = get_llm(0.3).invoke(prompt)
        title = response.strip().strip('"\'').strip()
        title = title.rstrip(".,!?;:")
        if len(title) > 50:
            title = title[:47] + "..."
        if title:
            return title
    except Exception as e:
        print(f"Warning: Ollama session name generation failed: {e}")

    # Fallback: truncate the user message
    fallback = user_message.strip().splitlines()[0][:50].strip()
    return fallback if fallback else "New Chat"


def load_recent_history(supabase: Client, chat_session: str):
    """Last CHAT_HISTORY_TURNS question/answer pairs for the session, oldest first."""
    try:
        resp = (
            supabase.from_("chat_messages")
            .select("role", "content")
            .eq("chat_session_id", chat_session)
            .order("created_at", desc=True)
            .limit(config.CHAT_HISTORY_TURNS * 2)
            .execute()
        )
        rows = list(reversed(resp.data or []))
    except Exception as e:
        # On failure to query history, proceed with empty history but log the error
        print(f"Failed to load chat history from Supabase: {e}")
        rows = []
    return format_chat_history_from_supabase(rows)


def chat(user_message: str, chat_session: str, team_id: str) -> str:
    """Main chat entrypoint.

    - Loads recent chat history for `chat_session` from Supabase
    - Invokes the team-scoped RAG chain with the user's question and history
    - Persists the question and answer, and returns the answer
    """
    ollama_models.ensure_models()
    supabase = get_supabase()

    # Check if session has a name, if null generate one using Ollama
    try:
        session_resp = supabase.from_("chat_sessions").select("session_name").eq("id", chat_session).maybe_single().execute()
        session_row = getattr(session_resp, "data", None) if session_resp else None
        current_name = session_row.get("session_name") if isinstance(session_row, dict) else None

        if not current_name or not str(current_name).strip():
            generated_name = session_name_gen(user_message)
            supabase.from_("chat_sessions").update({"session_name": generated_name}).eq("id", chat_session).execute()
    except Exception as e:
        print(f"Warning: Failed to check/update session name: {e}")

    chat_history = render_chat_history(load_recent_history(supabase, chat_session))
    rag_chain, _ = create_rag_chain(team_id)

    try:
        answer = rag_chain.invoke({"question": user_message, "chat_history": chat_history})
    except Exception as e:
        raise RuntimeError(f"RAG chain invocation failed: {e}")

    try:
        supabase.from_("chat_messages").insert([
            {"chat_session_id": chat_session, "role": "user", "content": user_message},
            {"chat_session_id": chat_session, "role": "assistant", "content": answer},
        ]).execute()
    except Exception as e:
        print(f"Failed to persist chat messages to Supabase: {e}")

    return answer
