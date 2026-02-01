import sys
import json
import os
import argparse
import shutil
import uuid
import base64
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Configuration
OLLAMA_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_LLM = "MedAIBase/MedGemma1.5:4b"
VISION_LLM = "llava:latest" # Recommended for images
EMBEDDING_MODEL = "bge-m3:latest"

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def run_rag_chat(prompt, pdf_path=None, image_path=None):
    temp_dir = f"temp_rag_{uuid.uuid4().hex}"
    vectorstore = None
    
    try:
        if image_path and os.path.exists(image_path):
            # 1. Multi-modal Vision Path
            llm = ChatOllama(model=VISION_LLM, base_url=OLLAMA_BASE_URL, temperature=0.1, timeout=300)
            # For Ollama Vision models, we often need to pass the image in the prompt or as a message
            # LangChain Ollama supports this via 'images' in the invoke call
            from langchain_core.messages import HumanMessage
            
            img_base64 = encode_image(image_path)
            message = HumanMessage(
                content=prompt,
                images=[img_base64]
            )
            ai_response = llm.invoke([message]).content

        elif pdf_path and os.path.exists(pdf_path):
            # 2. PDF RAG Path
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
            splits = text_splitter.split_documents(docs)
            
            embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL, base_url=OLLAMA_BASE_URL)
            vectorstore = Chroma.from_documents(
                documents=splits, 
                embedding=embeddings,
                persist_directory=temp_dir
            )
            
            llm = ChatOllama(
                model=DEFAULT_LLM, 
                base_url=OLLAMA_BASE_URL,
                temperature=0.3,
                num_ctx=8192,
                timeout=300
            )
            
            template = """You are CareFusion AI, an advanced medical intelligence assistant. 
            Use the following pieces of retrieved clinical context to answer the user request.
            If the answer is not in the context, use your internal medical knowledge but state that it is not explicitly in the document.
            Contextual accuracy is critical.

            CONTEXT:
            {context}

            USER CLINICAL REQUEST: {question}

            MEDICAL ANALYSIS:"""
            
            QA_CHAIN_PROMPT = PromptTemplate.from_template(template)
            
            qa_chain = RetrievalQA.from_chain_type(
                llm,
                retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
                chain_type_kwargs={"prompt": QA_CHAIN_PROMPT}
            )
            
            response = qa_chain.invoke({"query": prompt})
            ai_response = response["result"]
            
        else:
            # 3. Standard Chat Path
            llm = ChatOllama(model=DEFAULT_LLM, base_url=OLLAMA_BASE_URL, temperature=0.3, timeout=300)
            ai_response = llm.invoke(prompt).content

    except Exception as e:
        ai_response = f"AI Inference Error (Local Node): {str(e)}"
        if "llava" in str(e).lower():
            ai_response += "\n\nTip: To analyze images, please run 'ollama pull llava' on the clinical node."
    finally:
        # Cleanup - Windows-safe approach
        import time
        import gc
        
        if vectorstore:
            try:
                # Explicitly delete collection and close client
                vectorstore.delete_collection()
                if hasattr(vectorstore, '_client'):
                    del vectorstore._client
                del vectorstore
                gc.collect()  # Force garbage collection
                time.sleep(0.5)  # Give Windows time to release file handles
            except Exception as cleanup_error:
                print(f"Warning: Vector store cleanup issue: {cleanup_error}")
        
        # Remove temp directory with retry for Windows
        if os.path.exists(temp_dir):
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    shutil.rmtree(temp_dir)
                    break
                except PermissionError:
                    if attempt < max_retries - 1:
                        time.sleep(1)  # Wait for file handles to close
                        gc.collect()
                    else:
                        print(f"Warning: Could not delete temp directory {temp_dir}. It will be cleaned on next run.")
        
        # Cleanup temp files passed by backend
        if pdf_path and "/temp_chat/" in pdf_path and os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except Exception:
                pass
        if image_path and "/temp_chat/" in image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception:
                pass

    result = {
        "ai_response": ai_response,
        "status": "success"
    }
    
    print("---PIPELINE_OUTPUT_START---")
    print(json.dumps(result))
    print("---PIPELINE_OUTPUT_END---")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("prompt", help="User text input")
    parser.add_argument("--pdf", help="Path to PDF document", default=None)
    parser.add_argument("--image", help="Path to clinical image", default=None)
    
    args = parser.parse_args()
    
    if sys.stdout.encoding != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
    run_rag_chat(args.prompt, args.pdf, args.image)
