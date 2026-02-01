import json
import time
from typing import Dict,Any,List,Optional
from concurrent.futures import ThreadPoolExecutor

# Tools.py (partial) — replace existing _normalize_symptom_json with this robust version
import json
import re
from typing import Any, Dict, Optional

def _find_first_json_object(s: str) -> Optional[str]:
    """
    Return the first balanced top-level JSON object substring from s, or None.
    Scans for the first '{' then finds matching '}' using stack counting.
    """
    if not s:
        return None

    # Quick check: maybe the whole string is valid JSON already
    try:
        json.loads(s)
        return s
    except Exception:
        pass

    start_idx = None
    depth = 0
    for i, ch in enumerate(s):
        if ch == "{":
            if start_idx is None:
                start_idx = i
            depth += 1
        elif ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start_idx is not None:
                    candidate = s[start_idx : i + 1]
                    # Try parsing the candidate
                    try:
                        json.loads(candidate)
                        return candidate
                    except Exception:
                        # not valid JSON (maybe trailing commas or stray text); continue searching
                        start_idx = None
                        depth = 0
    # Last-resort regex capture (may be noisy)
    m = re.search(r"(\{(?:.|\s)*\})", s)
    if m:
        candidate = m.group(1)
        try:
            json.loads(candidate)
            return candidate
        except Exception:
            return None
    return None

def _normalize_symptom_json(raw_text: str) -> Dict[str, Any]:
    """
    Normalize LLM symptom extraction output into a Python dict.

    Behaviour:
      - If raw_text is valid JSON -> parse and return dict
      - Else, try to extract the first balanced {...} block and parse it
      - If still no valid JSON found -> raise ValueError with helpful debug info
    """
    if raw_text is None:
        raise ValueError("No input text to parse.")

    # strip leading/trailing whitespace
    cleaned = raw_text.strip()

    # 1) Direct parse attempt
    try:
        obj = json.loads(cleaned)
        if isinstance(obj, dict):
            return obj
        # If parsed JSON is not a dict (e.g., list), wrap it to a dict under a key
        return {"result": obj}
    except json.JSONDecodeError:
        pass

    # 2) Find first balanced JSON object substring
    json_sub = _find_first_json_object(cleaned)
    if json_sub:
        try:
            parsed = json.loads(json_sub)
            if isinstance(parsed, dict):
                return parsed
            return {"result": parsed}
        except json.JSONDecodeError as e:
            # parsing failed despite extraction — show debug
            raise ValueError(f"Extracted JSON substring but json.loads failed: {e}\nSubstring:{json_sub}") from e

    # 3) Nothing worked -> raise with helpful context (do not swallow underlying text)
    # Show a short preview (first 1000 chars) to help debugging in logs
    preview = cleaned[:1000].replace("\n", " ")
    raise ValueError(f"LLM did not return a valid JSON object. Raw text (preview): {preview}")


def _cleanup_json_text(text: str) -> str:
    """Strip Markdown fences and keep only JSON."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 3:
            candidate = parts[1]
            candidate = candidate.lstrip("json").strip()
            return candidate
    return text




def flatten_docs(docs):
    flat = []
    for item in docs:
        if isinstance(item, list):
            flat.extend(item)
        else:
            flat.append(item)
    return flat


def summarize_context(llm: Any, context: str, user_query: str) -> str:
    """
    Summarize the retrieved documents to reduce the content sent to the final model.
    Single-pass summarization for maximum speed.
    """
    if not context.strip():
        return "No relevant medical documents found."

    # If context is very small, don't even bother calling the LLM
    if len(context) < 1500:
        return context

    # Strict truncation for summarizer input
    input_text = context[:6000]

    summary_prompt = f"""
    Briefly summarize clinical facts from these documents relevant to: {user_query}.
    Keep it short and dense.
    
    TEXT:
    {input_text}
    
    SUMMARY:
    """
    
    try:
        response = llm.invoke(summary_prompt)
        if hasattr(response, "content"):
            return response.content
        return str(response)
    except Exception as e:
        print(f"Summarization failed: {e}")
        return context[:2000] 


class Timer:
    def __init__(self, name: str):
        self.name = name
    def __enter__(self):
        self.start = time.time()
        print(f"\n>>> Starting: {self.name}")
        return self
    def __exit__(self, *args):
        self.end = time.time()
        print(f"<<< Finished: {self.name} in {self.end - self.start:.2f}s")