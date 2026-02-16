# vector_search_fixed.py
"""
Safe runner for multi-query retrieval using Chroma + Ollama embeddings.

Usage:
  - Set CHROMA_DB_PATH, COLLECTION_NAME, EMBEDDING_MODEL, OLLAMA_BASE_URL
  - Run: python vector_search_fixed.py
"""

import os
import sys
import io
import traceback
from typing import List, Sequence, Optional

# Force UTF-8 for Windows console/subprocess output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # Fallback for older python or restricted environments
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Prefer langchain_ollama (official wrapper). Fallback to community wrappers if needed.
try:
    from langchain_ollama import OllamaEmbeddings, ChatOllama
except Exception:
    try:
        from langchain_community.embeddings import OllamaEmbeddings  # type: ignore
        from langchain_community.chat_models import ChatOllama  # type: ignore
    except Exception:
        raise RuntimeError("Ollama embeddings/chat wrappers not available. Install langchain_ollama or langchain_community.")

from langchain_chroma import Chroma
from langchain_core.documents import Document

from Multi_Query_Retriver import multi_query_retrieve
from MY_Model import get_chat_model, DEFAULT_LLM_MODEL, EMBEDDING_MODEL_NAME

# --- CONFIG: make sure these match your index builder ---
EMBEDDING_MODEL = EMBEDDING_MODEL_NAME
OLLAMA_BASE_URL = "http://127.0.0.1:11434"
CHROMA_DB_PATH = r"C:\CareFusion-AI\vector of external\chroma_db_bge_m3"
COLLECTION_NAME = "daily_knowledge"

# Helper: format lists
def _format_list(items: Sequence[str], empty_placeholder: str = "None") -> str:
    if not items:
        return empty_placeholder
    return ", ".join(str(x) for x in items)

def build_clinical_query(
    transcription: str,
    symptoms: List[str],
    duration: Optional[str],
    red_flags: List[str],
    disease_prediction: object,
) -> str:
    duration_str = duration if duration else "not clearly specified"
    symptoms_str = _format_list(symptoms, empty_placeholder="not clearly identified")
    red_flags_str = _format_list(red_flags, empty_placeholder="none reported")

    if isinstance(disease_prediction, dict) and "disease" in disease_prediction:
        disease_str = disease_prediction["disease"]
    else:
        disease_str = str(disease_prediction)

    return f"""
You are assisting with a clinical reasoning task.

Transcript of the patient encounter:
\"\"\"{transcription}\"\"\"

Extracted structured data:
- Symptoms: {symptoms_str}
- Duration: {duration_str}
- Red flags: {red_flags_str}
- Predicted disease (from internal model): {disease_str}

Retrieve information that:
- Helps confirm or refute the predicted disease.
- Suggests important differential diagnoses.
- Highlights red-flag conditions or emergency considerations.
- Provides guidance on recommended investigations and management steps.

Return the most relevant passages for a clinician to review.
""".strip()

def _maybe_embed_test(embeddings) -> Optional[int]:
    # compute one embedding and print its length; return dimension or None
    try:
        if hasattr(embeddings, "embed_documents"):
            vecs = embeddings.embed_documents(["sample"])
        elif hasattr(embeddings, "embed_query"):
            vecs = [embeddings.embed_query("sample")]
        else:
            print("Embedding object has no known embed_documents/embed_query method; skipping test.")
            return None
    except Exception as e:
        print("Embedding test failed:", e)
        return None
    if not vecs:
        print("Embedding returned nothing.")
        return None
    print("embedding vector length:", len(vecs[0]))
    return len(vecs[0])

def print_collection_info(vectorstore):
    try:
        coll = getattr(vectorstore, "_collection", None)
        client = getattr(vectorstore, "_client", None)
        print("vectorstore._collection set:", bool(coll))
        # try to read collection count
        try:
            print("collection.count():", coll.count() if coll else "n/a")
        except Exception:
            try:
                # attempt via client
                if client and hasattr(client, "get_or_create_collection"):
                    c = client.get_or_create_collection(collection_name=COLLECTION_NAME)
                    print("client.get_or_create_collection.count (fallback):", getattr(c, "count", lambda: "n/a")())
            except Exception:
                pass
    except Exception:
        traceback.print_exc()

def run_custom_multiquery_retrieval(
    transcription: str,
    symtom_list: List[str],
    duration: Optional[str],
    red_flags: List[str],
    disease_prediction: object,
    *,
    num_queries: int = 3,
    k_per_query: int = 10,
):
    # ensure DB path exists
    if not os.path.isdir(CHROMA_DB_PATH):
        raise FileNotFoundError(f"Chroma DB path not found: {CHROMA_DB_PATH}")

    # instantiate embeddings (match builder)
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL, base_url=OLLAMA_BASE_URL)
    emb_dim = _maybe_embed_test(embeddings)
    if emb_dim is None:
        print("Warning: embedding dimension unknown; continue but check compatibility with your collection.")

    # open Chroma collection
    try:
        vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            persist_directory=CHROMA_DB_PATH,
            embedding_function=embeddings,
        )
    except Exception as e:
        traceback.print_exc()
        raise RuntimeError("Failed to open Chroma collection; check embedding compatibility and collection name.") from e

    print_collection_info(vectorstore)


    # create retriever
    base_retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": k_per_query})

    # LLM to generate alternative queries
    llm = get_chat_model(model=DEFAULT_LLM_MODEL, temperature=0.2)

    # build query
    query = build_clinical_query(transcription, symtom_list, duration, red_flags, disease_prediction)
    print("[run_custom_multiquery_retrieval] clinical query (preview):")
    print(query[:500])

    # call multi-query retriever
    docs = multi_query_retrieve(
        base_retriever=base_retriever,
        llm=llm,
        user_query=query,
        num_queries=num_queries,
        k_per_query=k_per_query,
    )

    print("[run_custom_multiquery_retrieval] total unique docs:", len(docs))
    for i, doc in enumerate(docs[:10], start=1):
        print(f"\n--- Result {i} ---")
        content = getattr(doc, "page_content", "")
        try:
            print(content[:1000])
        except UnicodeEncodeError:
            # Fallback for environments where UTF-8 reconfigure isn't enough
            print(content[:1000].encode('ascii', errors='replace').decode('ascii'))
    return docs

if __name__ == "__main__":
    # Demo placeholders — replace with actual outputs from your audio->symptom pipeline
    transcription_demo = "Patient reports progressive breathlessness for 3 days with chest tightness."
    symptoms_demo = ["shortness of breath", "chest tightness"]
    duration_demo = "3 days"
    red_flags_demo = ["chest tightness"]
    disease_prediction_demo = {"disease": "possible heart failure", "confidence": 0.62}

    docs = run_custom_multiquery_retrieval(
        transcription_demo,
        symptoms_demo,
        duration_demo,
        red_flags_demo,
        disease_prediction_demo,
        num_queries=3,
        k_per_query=10,
    )
    print("Done. Retrieved documents:", len(docs))
