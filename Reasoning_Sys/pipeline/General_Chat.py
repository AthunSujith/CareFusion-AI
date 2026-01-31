import sys
import json
import os
import argparse
from pypdf import PdfReader
import requests

def extract_text_from_pdf(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def run_general_chat(prompt, pdf_path=None):
    # MedGemma 1.5 4B as requested
    model = "MedAIBase/MedGemma1.5:4b"
    ollama_url = "http://localhost:11434/api/generate"
    
    context_text = ""
    if pdf_path and os.path.exists(pdf_path):
        pdf_text = extract_text_from_pdf(pdf_path)
        # Limit text if it's too long for context (simple truncation for now)
        if len(pdf_text) > 10000:
            pdf_text = pdf_text[:10000] + "... [truncated]"
        context_text = f"\n\n[MEDICAL DOCUMENT CONTENT]:\n{pdf_text}\n"
    
    full_prompt = (
        "You are CareFusion AI, an advanced medical intelligence assistant. "
        "Your task is to analyze medical requests and documents with high precision. "
        "Provide summaries that focus on clinical details, symptoms, observations, and medical implications. "
        "Avoid generic non-medical responses.\n\n"
        f"{context_text}\n"
        f"USER CLINICAL REQUEST: {prompt}\n\n"
        "MEDICAL ANALYSIS:"
    )
    
    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "top_p": 0.9
        }
    }
    
    try:
        # Using a longer timeout for medical reasoning
        response = requests.post(ollama_url, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        ai_response = data.get("response", "No response from AI.")
    except Exception as e:
        ai_response = f"AI Inference Error (Local Node): {str(e)}"

    result = {
        "ai_response": ai_response,
        "status": "success"
    }
    
    # Standard format for CareFusion backend to parse
    print("---PIPELINE_OUTPUT_START---")
    print(json.dumps(result))
    print("---PIPELINE_OUTPUT_END---")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("prompt", help="User text input")
    parser.add_argument("--pdf", help="Path to PDF document", default=None)
    
    args = parser.parse_args()
    
    # Set default encoding to UTF-8 for Windows
    if sys.stdout.encoding != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
    run_general_chat(args.prompt, args.pdf)
