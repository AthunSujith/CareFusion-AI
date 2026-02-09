from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import os
import shutil
from pathlib import Path
from typing import List
from app.core.config import get_settings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
import logging

router = APIRouter()
settings = get_settings()
logger = logging.getLogger("knowledge_router")

# --- CONFIG ---
PERSIST_DIR = r"C:\CareFusion-AI\vector of external\chroma_db_bge_m3"
COLLECTION_NAME = "Daily Knowledge"
EMBED_MODEL = "bge-m3"
UPLOAD_DIR = r"C:\CareFusion-AI\External_knowledger"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_embeddings():
    return OllamaEmbeddings(
        model=EMBED_MODEL,
        base_url="http://127.0.0.1:11434"
    )

@router.post("/upload")
async def upload_medical_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save file locally
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save document.")

    # Process and Embed (Foreground/Synchronous for prototype simplicity)
    try:
        embeddings = get_embeddings()
        vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            persist_directory=PERSIST_DIR,
            embedding_function=embeddings,
        )

        loader = PyPDFLoader(file_path)
        pages = loader.load()
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=4200,
            chunk_overlap=800,
        )
        chunks = splitter.split_documents(pages)

        # Enrich metadata
        for chunk in chunks:
            chunk.metadata["source"] = file.filename
            chunk.metadata["ingest_mode"] = "admin_portal"

        vectorstore.add_documents(chunks)
        
        return {
            "status": "success",
            "filename": file.filename,
            "chunks_added": len(chunks),
            "total_vectors": vectorstore._collection.count()
        }
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document saved but embedding failed: {str(e)}")

@router.get("/status")
async def get_knowledge_status():
    try:
        embeddings = get_embeddings()
        vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            persist_directory=PERSIST_DIR,
            embedding_function=embeddings,
        )
        
        # Get count of files in UPLOAD_DIR
        files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith(".pdf")]
        
        return {
            "collection_name": COLLECTION_NAME,
            "document_count": len(files),
            "vector_count": vectorstore._collection.count(),
            "last_upload": datetime.fromtimestamp(os.path.getmtime(UPLOAD_DIR)).isoformat() if files else None
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

from datetime import datetime
