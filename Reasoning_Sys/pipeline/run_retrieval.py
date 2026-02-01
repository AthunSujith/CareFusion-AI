# run_retrieval.py
import os
import traceback
from typing import List, Sequence, Optional

# Use langchain_ollama if installed; fallback to community wrapper
try:
    from langchain_ollama import OllamaEmbeddings, ChatOllama
except Exception:
    from langchain_community.embeddings import OllamaEmbeddings  # type: ignore
    from langchain_community.chat_models import ChatOllama  # type: ignore

from langchain_chroma import Chroma
from langchain_core.documents import Document

# import your Multi_Query_Retriver implementation
from Multi_Query_Retriver import multi_query_retrieve

# CONFIG: must match build_index.py
EMBEDDING_MODEL = "bge-m3"
OLLAMA_BASE_URL = "http://127.0.0.1:11434"
CHROMA_DB_PATH = r"C:\CareFusion-AI\chroma_external_bge_m3"
COLLECTION_NAME = "external_bge_m3"

def print_db_info(vectorstore):
    try:
        # internal collection object exists
        coll = getattr(vectorstore, "_collection", None)
        client = getattr(vectorstore, "_client", None)
        print("vectorstore._collection:", bool(coll))
        print("vectorstore._client:", bool(client))
        # try to read collection item count
        try:
            count = coll.count()
            print("collection.count():", count)
        except Exception:
            try:
                # try via client (chromadb.Client)
                if client and hasattr(client, "get_or_create_collection"):
                    c = client.get_or_create_collection(collection_name=COLLECTION_NAME)
                    print("client.get_or_create_collection.count:", getattr(c, "count", lambda: "n/a")())
            except Exception:
                pass
    except Exception:
        traceback.print_exc()

def simple_embedding_check(embeddings):
    # compute one embedding and print its length
    text = "sample text for embedding test"
    try:
        vecs = embeddings.embed_documents([text])
    except Exception:
        try:
            # some wrappers use embed_query / embed_documents signatures
            vec_single = embeddings.embed_query(text)
            vecs = [vec_single]
        except Exception as e:
            print("Embedding test failed:", e)
            return None
    if not vecs:
        print("Embedding returned nothing")
        return None
    print("embedding vector length:", len(vecs[0]))
    return len(vecs[0])

def _format_list(items: Sequence[str], empty_placeholder: str = "None") -> str:
    if not items:
        return empty_placeholder
    return ", ".join(str(x) for x in items)

def build_clinical_query(transcription: str, symptoms: List[str], duration: Optional[str], red_flags: List[str], disease_prediction: object) -> str:
    duration_str = duration or "not specified"
    return f"""Transcript:
\"\"\"{transcription}\"\"\"

Symptoms: {_format_list(symptoms)}
Duration: {duration_str}
Red flags: {_format_list(red_flags)}
Predicted disease: {disease_prediction}

Retrieve relevant passages that help confirm/refute the predicted disease, differential, red flags, and investigations.
"""

def run_demo():
    # Quick environment sanity
    if not os.path.isdir(CHROMA_DB_PATH):
        raise FileNotFoundError(f"Chroma DB path not found: {CHROMA_DB_PATH}")

    # instantiate embeddings exactly as in build_index
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL, base_url=OLLAMA_BASE_URL)
    emb_dim = simple_embedding_check(embeddings)
    if emb_dim is None:
        raise RuntimeError("Embedding check failed - fix Ollama / embedding model")

    # open Chroma
    vectorstore = Chroma(collection_name=COLLECTION_NAME, persist_directory=CHROMA_DB_PATH, embedding_function=embeddings)
    print_db_info(vectorstore)

    # quick sanity similarity_search
    try:
        sample = vectorstore.similarity_search("test", k=3)
        print("[sanity] sample similarity_search results:", len(sample))
    except Exception:
        traceback.print_exc()
        raise RuntimeError("Chroma similarity_search failed; check embedding dims / collection compatibility")

    # base retriever from the vectorstore
    base_retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})

    # LLM to generate alternate queries (same type you used elsewhere)
    llm = ChatOllama(model="llama3.2:3b", temperature=0.2)

    # Demo clinical inputs (replace with real ones)
    transcription = "Patient reports progressive breathlessness for 3 days with chest tightness."
    symptoms = ["shortness of breath", "chest tightness"]
    duration = "3 days"
    red_flags = ["chest tightness"]
    disease_prediction = {"disease": "possible heart failure", "confidence": 0.62}

    query = build_clinical_query(transcription, symptoms, duration, red_flags, disease_prediction)
    print("[run_retrieval] clinical query preview:", query[:400])

    docs = multi_query_retrieve(base_retriever=base_retriever, llm=llm, user_query=query, num_queries=12, k_per_query=10)
    print("[run_retrieval] total docs:", len(docs))
    for i, d in enumerate(docs[:5], start=1):
        print("--- Doc", i)
        print(getattr(d, "page_content", "")[:600])
        print("metadata:", getattr(d, "metadata", None))

if __name__ == "__main__":
    run_demo()
