"""Make sure the Ollama models we need are pulled.

Runs once at startup (see app.lifespan) and lazily on first use if Ollama was
not reachable at startup, instead of on every chat request.
"""

import threading
import requests
import config

_lock = threading.Lock()
_ready = False


def _ensure_model(model: str) -> None:
    tags = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags", timeout=10).json().get("models", [])
    installed = {m["name"] for m in tags}
    # Ollama reports untagged models as "<name>:latest"
    if model in installed or f"{model}:latest" in installed:
        return

    print(f"Pulling Ollama model: {model}")
    r = requests.post(
        f"{config.OLLAMA_BASE_URL}/api/pull",
        json={"name": model, "stream": False},
        timeout=config.OLLAMA_PULL_TIMEOUT,
    )
    r.raise_for_status()


def ensure_models() -> None:
    global _ready
    if _ready:
        return
    with _lock:
        if _ready:
            return
        _ensure_model(config.OLLAMA_EMBEDDING_MODEL)
        _ensure_model(config.OLLAMA_LLM_MODEL)
        _ready = True
