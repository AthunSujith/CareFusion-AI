from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings

# -------------------------------------------------
# CONFIG — MUST MATCH EXISTING STORE (DO NOT CHANGE)
# -------------------------------------------------
PERSIST_DIR = r"C:\CareFusion-AI\vector of external\chroma_db_bge_m3"
COLLECTION_NAME = "external_knowledge_bge_m3"
EMBED_MODEL = "bge-m3"

NEW_DOCS_PATH = Path(r"C:\CareFusion-AI\External_knowledger")

# -------------------------------------------------
# 1. Embeddings (EXACT SAME AS ORIGINAL)
# -------------------------------------------------
embeddings = OllamaEmbeddings(
    model=EMBED_MODEL,
    base_url="http://127.0.0.1:11434"
)

# -------------------------------------------------
# 2. Load existing Chroma collection (APPEND ONLY)
# -------------------------------------------------
vectorstore = Chroma(
    collection_name=COLLECTION_NAME,
    persist_directory=PERSIST_DIR,
    embedding_function=embeddings,
)

print("Existing vector count:", vectorstore._collection.count())

# -------------------------------------------------
# 3. Splitter (MUST MATCH ORIGINAL SETTINGS)
# -------------------------------------------------
splitter = RecursiveCharacterTextSplitter(
    chunk_size=4200,
    chunk_overlap=800,
)

# -------------------------------------------------
# 4. LAZY LOAD + STREAM INGESTION
# -------------------------------------------------
BATCH_SIZE = 10
buffer = []

for pdf_path in NEW_DOCS_PATH.rglob("*.pdf"):
    print(f"📄 Lazy loading: {pdf_path}")

    loader = PyPDFLoader(str(pdf_path))

    # IMPORTANT: lazy_load() yields ONE PAGE AT A TIME
    for page_doc in loader.lazy_load():
        # Enrich metadata (important for traceability)
        page_doc.metadata["source"] = str(pdf_path)
        page_doc.metadata["ingest_mode"] = "lazy_append"

        # Split page → chunks
        chunks = splitter.split_documents([page_doc])

        for chunk in chunks:
            buffer.append(chunk)

            if len(buffer) >= BATCH_SIZE:
                vectorstore.add_documents(buffer)
                print(f"✅ Added {len(buffer)} chunks")
                buffer.clear()

# Flush remaining chunks
if buffer:
    vectorstore.add_documents(buffer)
    print(f"✅ Added final {len(buffer)} chunks")

print("🎯 Ingestion complete.")
print("Updated vector count:", vectorstore._collection.count())
