from langchain_ollama import OllamaEmbeddings, ChatOllama
import whisper
from functools import lru_cache
from typing import Optional



@lru_cache(maxsize=4)
def load_whisper_model(size: str):
    return whisper.load_model(size)

def audio_text(
    audio_path: str,
    size: str = "tiny",      # Changed to tiny for 5x speed boost
    language: Optional[str] = "en",
    fp16: bool = True       # Enabled FP16 for speed
) -> str:
    model = load_whisper_model(size)

    result = model.transcribe(
        audio_path,
        language=language,
        fp16=fp16
    )

    return result["text"]




# --- Configuration Layer (single source of truth) ---

DEFAULT_LLM_MODEL = "llama3.2:3b"
FINAL_LLM_MODEL = "MedAIBase/MedGemma1.5:4b"
CARL_ADVISOR_MODEL = "MedAIBase/MedGemma1.5:4b"  # Specialized for clinical advisory loop
DEFAULT_MAX_TOKENS = 2048
DEFAULT_TEMPERATURE = 0.7

# --- Factory Function ---

def get_chat_model(
    *,
    model: str = DEFAULT_LLM_MODEL,
    temperature: float = DEFAULT_TEMPERATURE,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    timeout: Optional[int] = None,
) -> ChatOllama:
    """
    Create and return a production-configured ChatOllama instance.
    """

    if not 0.0 <= temperature <= 2.0:
        raise ValueError(f"Invalid temperature: {temperature}")

    import requests
    try:
        requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
    except Exception:
        raise RuntimeError(
            "Ollama server is not running. Please ensure Ollama is started."
        )

    return ChatOllama(
        model=model,
        temperature=temperature,
        num_predict=max_tokens,
        timeout=timeout,
        num_ctx=2048,     # Further reduced to 2048 to force more layers onto GPU VRAM
        num_thread=8,
    )
    
    # example usage of the model function
    # llm = get_chat_model()
    #
    #llm = get_chat_model(
    #    temperature=0.2,
    #    max_tokens=1024,
    #)
    #



# --- Single source of truth for embedding config ---
EMBEDDING_MODEL_NAME = "bge-m3:latest"


def get_embedding_model(
    EMBEDDING_MODEL_NAME : Optional[str] = "bge-m3:latest",
    base_url: Optional[str] = None,
) -> OllamaEmbeddings:
    """
    Return a configured OllamaEmbeddings instance.

    - Model is fixed to a dedicated embedding model.
    - Optional `base_url` allows remote Ollama instances.
    """
    return OllamaEmbeddings(
        model=EMBEDDING_MODEL_NAME,
        base_url=base_url,
    )