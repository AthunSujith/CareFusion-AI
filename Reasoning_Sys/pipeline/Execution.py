from MY_Model import get_chat_model, audio_text, get_embedding_model, DEFAULT_LLM_MODEL, FINAL_LLM_MODEL
from MY_Prompt import prompt, final_prompt_template
from MY_Format import parser, SymptomModel, FinalBaseModel
import time

# Single import for run_custom_multiquery_retrieval (adjust path if needed)
from Vector_Search import run_custom_multiquery_retrieval

from Tools import _normalize_symptom_json, flatten_docs, summarize_context, Timer
from typing import Optional, Any, List, Dict
import os
import sys
import traceback
import json
import re
import io

# Force UTF-8 for Windows console/subprocess output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # Fallback for older python or restricted environments
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# helper to safely extract text from LangChain runnable results
def _result_to_text(result: Any) -> str:
    """
    Normalize an LLM chain result to plain string.
    Accepts objects with .content or .text, or plain strings.
    """
    if result is None:
        return ""
    if isinstance(result, str):
        return result
    # ChatMessage-like
    if hasattr(result, "content"):
        return result.content
    if hasattr(result, "text"):
        return result.text
    # fallback
    return str(result)


def _extract_json_substring(s: str) -> Optional[str]:
    """
    Try to find the first top-level JSON object in string `s`.
    Returns the JSON substring or None.
    This is defensive: LLMs sometimes add surrounding text.
    """
    if not s:
        return None
    # First try to parse entire string
    try:
        json.loads(s)
        return s
    except Exception:
        pass

    # Heuristic: find first { ... } balanced braces block
    brace_stack = []
    start = None
    for i, ch in enumerate(s):
        if ch == "{":
            if start is None:
                start = i
            brace_stack.append(i)
        elif ch == "}":
            if brace_stack:
                brace_stack.pop()
                if not brace_stack and start is not None:
                    candidate = s[start : i + 1]
                    # try parse
                    try:
                        json.loads(candidate)
                        return candidate
                    except Exception:
                        # continue searching (maybe nested object not JSON)
                        start = None
                        brace_stack = []
    # Last resort: regex (greedy) — may produce invalid JSON if braces unmatched
    m = re.search(r"(\{(?:.|\s)*\})", s)
    if m:
        try:
            json.loads(m.group(1))
            return m.group(1)
        except Exception:
            return None
    return None


def pipeline(audio_path: Optional[str] = None, transcription: Optional[str] = None, history: Optional[str] = None) -> str:
    """
    Full pipeline:
      - transcribe audio (if transcription not provided)
      - extract symptoms via prompt + LLM
      - validate into SymptomModel
      - call run_symptom_test
      - run multi-query retrieval to get docs
      - build context and call final prompt chain
    Returns the final LLM textual response (string).
    """
    # 0) Project root insert (so relative imports work as your codebase expects)
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if PROJECT_ROOT not in sys.path:
        sys.path.insert(0, PROJECT_ROOT)

    # 0) Pre-flight Checks
    import requests
    try:
        requests.get("http://localhost:11434/api/tags", timeout=1)
    except:
        raise RuntimeError("Ollama server is not running. Please start Ollama before running the pipeline.")

    with Timer("Full Pipeline Execution"):
        # 1) Transcribe (skip if text already provided)
        if not transcription:
            if not audio_path:
                 raise ValueError("Either audio_path or transcription must be provided.")
            
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")

            try:
                with Timer("Audio Transcription (Whisper)"):
                    transcription = audio_text(audio_path)
                
                if not transcription.strip():
                    raise ValueError("Transcription is empty. The audio file might be silent or corrupted.")
                
                print("TRANSCRIPTION (first 300 chars):\n", transcription[:300])
            except Exception as e:
                traceback.print_exc()
                raise RuntimeError(f"Failed to transcribe audio: {e}")
        else:
            if not transcription.strip():
                raise ValueError("Provided transcription text is empty.")
            print("Using provided text transcription.")

        # 2) LLM + prompt to extract symptoms
        try:
            llm = get_chat_model(model=DEFAULT_LLM_MODEL)
        except Exception as e:
            traceback.print_exc()
            raise RuntimeError(f"Failed to instantiate chat model: {e}")

        # Build LLM chain for symptom extraction: prompt | llm
        text_chain = prompt | llm

        try:
            with Timer("Symptom Extraction (LLM)"):
                raw_text_result = text_chain.invoke({
                    "audio_transcription": transcription,
                    "history": history or "No previous medical history available."
                })
            raw_text = _result_to_text(raw_text_result)
            
            if not raw_text.strip():
                 raise RuntimeError("LLM returned an empty response during symptom extraction.")
                 
            print("\nRaw symptom-extraction output (first 600 chars):\n", raw_text[:600])
        except Exception as e:
            traceback.print_exc()
            raise RuntimeError(f"Symptom extraction chain failed: {e}")

        # 3) Normalize output to JSON-like dict and validate with Pydantic SymptomModel
        try:
            normalized_obj = _normalize_symptom_json(raw_text)
        except Exception as e:
            traceback.print_exc()
            raise RuntimeError(f"Failed to normalize symptom JSON: {e}")

        try:
            model_output: SymptomModel = SymptomModel.model_validate(normalized_obj)
        except Exception as e:
            traceback.print_exc()
            raise RuntimeError(f"SymptomModel validation failed: {e}")

        print("Parsed SymptomModel:")
        print(" - symptoms:", model_output.symptoms)
        print(" - duration:", model_output.duration)
        print(" - red_flags:", model_output.red_flags)
        print(" - notes:", getattr(model_output, "notes", None))

        # 4) Run your prediction / downstream model
        try:
            # attempt to import run_symptom_test; adapt this if your path differs
            from Disease_Prediction_Pipeline.test import run_symptom_test
        except Exception:
            # fallback import path if test.py is in project root
            try:
                from Disease_Prediction_Pipeline.test import run_symptom_test
            except Exception as e:
                traceback.print_exc()
                raise RuntimeError(f"Cannot import run_symptom_test: {e}")

        try:
            with Timer("Disease Prediction Model"):
                # run_symptom_test should accept a List[str] of symptom names
                result_prediction = run_symptom_test(model_output.symptoms, verbose=False)
            
            # Simplified display logic - result_prediction['final'] is already printed by run_symptom_test
        except Exception as e:
            traceback.print_exc()
            raise RuntimeError(f"run_symptom_test failed: {e}")

        # 5) Retrieval: call your multi-query retriever
        try:
            with Timer("Document Retrieval (Chroma + Multi-Query)"):
                docs = run_custom_multiquery_retrieval(
                    transcription,
                    model_output.symptoms,
                    model_output.duration,
                    model_output.red_flags,
                    result_prediction,
                )
        except Exception as e:
            traceback.print_exc()
            raise RuntimeError(f"run_custom_multiquery_retrieval failed: {e}")

        # 6) Flatten docs (use provided helper if available). if not present, coerce to list of Document
        final_docs = []
        try:
            final_docs = flatten_docs(docs)
        except Exception:
            # simple fallback flattening one level deep
            if docs is None:
                final_docs = []
            elif isinstance(docs, list) and docs and isinstance(docs[0], list):
                final_docs = [d for sub in docs for d in sub]
            elif isinstance(docs, list):
                final_docs = docs
            else:
                final_docs = []

        print(f"\nRetrieved {len(final_docs)} documents from retriever.")

        # 7) Build context string and summarize
        context_pieces = []
        for doc in final_docs:
            page_content = getattr(doc, "page_content", None)
            if page_content and isinstance(page_content, str) and page_content.strip():
                # prepend a short metadata tag so the LLM can cite
                meta = getattr(doc, "metadata", {}) or {}
                source = meta.get("source") or meta.get("title") or meta.get("file") or None
                if source:
                    context_pieces.append(f"[SOURCE: {source}]\n{page_content}")
                else:
                    context_pieces.append(page_content)
            else:
                # maybe doc is plain text or has .content
                text = getattr(doc, "content", None) or str(doc)
                if text and text.strip():
                    context_pieces.append(text)

        full_context = "\n\n".join(context_pieces)
        
        if not full_context.strip():
            print("WARNING: context is empty — no documents were retrieved.")
            summarized_context = "No relevant medical documents found."
        else:
            # OPTIMIZATION: Drastically limit context for speed
            MAX_RELEVANT_CHARS = 3500 
            if len(full_context) > MAX_RELEVANT_CHARS:
                print(f"Limiting context from {len(full_context)} to {MAX_RELEVANT_CHARS} chars.")
                full_context = full_context[:MAX_RELEVANT_CHARS]

            print("Full context length (chars):", len(full_context))
            
            # Skip summarization if context is already small
            if len(full_context) < 1500:
                print("Context small enough; skipping summarization.")
                summarized_context = full_context
            else:
                with Timer("Document Summarization"):
                    summarized_context = summarize_context(llm, full_context, transcription)
                print("Summarized context length (chars):", len(summarized_context))

        # 8) Final prompt -> LLM (MedGemma for final synthesis)
        winning_prediction = "No definitive clinical hypothesis identified."
        if isinstance(result_prediction, dict):
            final_info = result_prediction.get("final", {})
            if final_info.get("accepted"):
                disease = final_info.get("disease")
                conf = final_info.get("confidence", 0.0)
                bucket = final_info.get("bucket")
                winning_prediction = f"{disease} (Context: {bucket}, Confidence: {conf:.2%})"
            else:
                winning_prediction = f"Hypothesis Rejected: {final_info.get('decision_reason', 'Below safety threshold')}"

        final_text = ""
        try:
            with Timer("Final Clinical Synthesis (MedGemma)"):
                # Synchronized with global timeout (1200s)
                final_llm = get_chat_model(model=FINAL_LLM_MODEL, temperature=0.4, timeout=1200)
                final_chain = final_prompt_template | final_llm
                
                final_raw = final_chain.invoke({
                    "document": summarized_context,
                    "symptoms": model_output.symptoms,
                    "duration": model_output.duration,
                    "red_flags": model_output.red_flags,
                    "disease_prediction": winning_prediction,
                    "user_query": transcription,
                    "history": history or "No previous medical history available."
                })
            final_text = _result_to_text(final_raw)
        except Exception as e:
            traceback.print_exc()
            print(f"Final chain invoke failed ({type(e).__name__}): {e}")
            final_text = "Clinical synthesis timed out or failed. Please review raw symptoms and prediction."

        return {
            "symptoms": model_output.symptoms,
            "recommendation": winning_prediction,
            "ai_response": final_text
        }


if __name__ == "__main__":
    import sys
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description="Run Symptom Reasoning Pipeline")
    parser.add_argument("input", nargs="?", help="Path to audio file (mp3/wav) or text if --text is used")
    parser.add_argument("--text", action="store_true", help="Input is a text transcription, not a file path")
    parser.add_argument("--history", help="Historical medical context for the patient")
    
    args = parser.parse_args()
    
    # Handle the inputs correctly
    text_to_process = args.input if args.text else None
    file_to_process = args.input if not args.text else None
    
    # If no file is provided and not text mode, use default if it exists (for testing)
    if not args.text and not file_to_process:
        file_to_process = r"C:\CareFusion-AI\Reasoning_Sys\file.mp3"

    try:
        out = pipeline(audio_path=file_to_process, transcription=text_to_process, history=args.history)
        print("\n---PIPELINE_OUTPUT_START---")
        print(json.dumps(out))
        print("---PIPELINE_OUTPUT_END---")
    except Exception as e:
        print(f"\n---PIPELINE_ERROR---")
        print(str(e))
        sys.exit(1)
