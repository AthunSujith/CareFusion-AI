# build_index.py
from pathlib import Path
import os
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language
from langchain_chroma import Chroma

# CONFIG - change if needed
EMBEDDING_MODEL = "bge-m3"  # or "nomic-embed-text:latest" — same value must be used in retrieval
OLLAMA_BASE_URL = "http://127.0.0.1:11434"  # set to your Ollama host if different
PDF_FOLDER = Path(r"C:\CareFusion-AI\External_knowledger")
PERSIST_DIR = r"C:\CareFusion-AI\chroma_external_bge_m3"   # new clean folder
COLLECTION_NAME = "external_bge_m3"  # use a stable human-readable name

# create persist dir if missing
os.makedirs(PERSIST_DIR, exist_ok=True)

# 1) embeddings
embeddings = OllamaEmbeddings(
    model=EMBEDDING_MODEL,
    base_url=OLLAMA_BASE_URL,
)

# 2) load PDFs as pages (PyPDFLoader yields a Document per page)
all_docs = []
for pdf in PDF_FOLDER.rglob("*.pdf"):
    try:
        print("Loading:", pdf)
        loader = PyPDFLoader(str(pdf))
        pages = loader.load()
        all_docs.extend(pages)
    except Exception as e:
        print("Skipping PDF (load error):", pdf, "->", e)

print(f"Loaded {len(all_docs)} PDF pages.")

# 3) split to chunks
splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.MARKDOWN,
    chunk_size=3000,
    chunk_overlap=300,
)
chunks = splitter.split_documents(all_docs)
print(f"Split into {len(chunks)} chunks.")

# 4) create vectorstore and add
vectorstore = Chroma(
    collection_name=COLLECTION_NAME,
    persist_directory=PERSIST_DIR,
    embedding_function=embeddings,
)

# Add in batches
BATCH = 32
for i in range(0, len(chunks), BATCH):
    batch = chunks[i : i + BATCH]
    print(f"Adding batch {i}-{i+len(batch)-1} ({len(batch)})")
    vectorstore.add_documents(batch)

# 5) persist (langchain_chroma persist may be implicit but call anyway)
try:
    vectorstore.persist()
except Exception:
    # older/newer wrappers differ; ignore non-fatal
    pass

print("✅ Finished indexing into Chroma.")
print("Persist dir:", PERSIST_DIR)
print("Collection name:", COLLECTION_NAME)
