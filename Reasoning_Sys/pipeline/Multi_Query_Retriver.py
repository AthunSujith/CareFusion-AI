import asyncio
import inspect
import traceback
from typing import List, Set, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor

# Try imports that match newer/older LangChain packaging
try:
    from langchain_core.documents import Document
    from langchain_core.language_models.chat_models import BaseChatModel
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.runnables import Runnable
except Exception:
    # Fallback (older packaging names); keep Document and BaseChatModel only if available.
    from langchain_core.documents import Document  # type: ignore
    from langchain_core.language_models.chat_models import BaseChatModel  # type: ignore
    from langchain_core.prompts import ChatPromptTemplate  # type: ignore
    from langchain_core.runnables import Runnable  # type: ignore

import sys
import io

# Force UTF-8 for Windows console/subprocess output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # Fallback for older python or restricted environments
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def build_multi_query_prompt(num_queries: int,k_per_query: int) -> ChatPromptTemplate:
    """
    Build an LLM prompt that returns `num_queries` alternative, concise search queries.
    """
    template = f"""
You are an expert clinical information retrieval specialist supporting a
medical question-answering system (RAG over medical knowledge sources).

Your task is to rewrite the user's original question into {num_queries}
different, concise search queries that maximize recall of relevant medical
information while staying faithful to the original intent.

Formatting rules:
- Return EXACTLY {num_queries} different search queries.
- Each query must be on its own line.
- Do NOT number the queries.
- Do NOT add explanations or any extra text.

Original question:
{{question}}
"""
    return ChatPromptTemplate.from_template(template.strip())


def _maybe_await(fn, *args, **kwargs):
    """
    Call `fn`. If fn is an async function or returns a coroutine, run it synchronously.
    """
    try:
        if asyncio.iscoroutinefunction(fn):
            return asyncio.run(fn(*args, **kwargs))
        res = fn(*args, **kwargs)
        if asyncio.iscoroutine(res):
            return asyncio.run(res)
        return res
    except Exception:
        # Try calling once more and see if it returns a coroutine
        try:
            res = fn(*args, **kwargs)
            if asyncio.iscoroutine(res):
                return asyncio.run(res)
            return res
        except Exception:
            traceback.print_exc()
            raise


def generate_alternative_queries(
    llm: BaseChatModel,
    user_query: str,
    num_queries: int = 10,
    k_per_query: int =200000
) -> List[str]:
    """
    Use the llm to generate alternative queries. Returns up to num_queries strings.
    """
    prompt = build_multi_query_prompt(num_queries,k_per_query)
    # Create a prompt -> LLM Runnable chain (works with new runnable system)
    chain: Runnable = prompt | llm

    # Try different invocation styles and fall back gracefully
    try:
        try:
            result = chain.invoke({"question": user_query})
        except TypeError:
            # some runtimes accept keyword args
            result = chain.invoke(question=user_query)
    except Exception:
        try:
            # fallback: direct prompt formatting and calling llm.invoke(...)
            prompt_text = prompt.format_prompt(question=user_query)
            # many LLMs accept messages or text object - try to pass the messages if available
            result = llm.invoke(prompt_text.to_messages() if hasattr(prompt_text, "to_messages") else str(prompt_text))
        except Exception:
            traceback.print_exc()
            return []

    # Extract result text
    if hasattr(result, "content"):
        text = result.content
    elif hasattr(result, "text"):
        text = result.text
    else:
        text = str(result)

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    alt_queries = lines[:num_queries]
    if not alt_queries:
        print("[generate_alternative_queries] WARNING: LLM returned no queries. Raw output preview:")
        print(text[:1000])
    else:
        print(f"[generate_alternative_queries] Generated {len(alt_queries)} alternative queries.")
    return alt_queries


def _call_retriever(base_retriever, query: str) -> List[Document]:
    """
    Try multiple retriever invocation styles and return list[Document].
    Order tried:
      - base_retriever.get_relevant_documents(query)
      - base_retriever._get_relevant_documents(query, run_manager=None)
      - base_retriever.invoke({"query": query})
      - base_retriever.invoke(query)
    """
    # 1) Public API
    try:
        if hasattr(base_retriever, "get_relevant_documents"):
            fn = getattr(base_retriever, "get_relevant_documents")
            try:
                out = _maybe_await(fn, query)
            except TypeError:
                # some implementations require run_manager kw-only
                out = _maybe_await(fn, query, run_manager=None)
            if out is None:
                return []
            if isinstance(out, Document):
                return [out]
            if isinstance(out, list):
                return out
            try:
                return list(out)
            except Exception:
                return []
    except Exception:
        traceback.print_exc()

    # 2) Private API fallback
    try:
        if hasattr(base_retriever, "_get_relevant_documents"):
            fn = getattr(base_retriever, "_get_relevant_documents")
            sig = inspect.signature(fn)
            call_kwargs = {}
            if "run_manager" in sig.parameters:
                call_kwargs["run_manager"] = None
            try:
                out = _maybe_await(fn, query, **call_kwargs)
            except TypeError:
                try:
                    out = _maybe_await(fn, query=query, **call_kwargs)
                except Exception:
                    traceback.print_exc()
                    out = None
            if out is None:
                return []
            if isinstance(out, Document):
                return [out]
            if isinstance(out, list):
                return out
            try:
                return list(out)
            except Exception:
                return []
    except Exception:
        traceback.print_exc()

    # 3) Runnable-style invoke
    try:
        if hasattr(base_retriever, "invoke"):
            fn = getattr(base_retriever, "invoke")
            try:
                out = _maybe_await(fn, {"query": query})
            except TypeError:
                # try positional fallback
                try:
                    out = _maybe_await(fn, query)
                except Exception:
                    traceback.print_exc()
                    out = None
            if out is None:
                return []
            if isinstance(out, Document):
                return [out]
            if isinstance(out, list):
                return out
            try:
                return list(out)
            except Exception:
                return []
    except Exception:
        traceback.print_exc()

    # Nothing worked
    return []


def multi_query_retrieve(
    base_retriever,
    llm: BaseChatModel,
    user_query: str,
    *,
    num_queries: int = 10,
    k_per_query: int = 200000,
) -> List[Document]:
    """
    Generate alternative queries via LLM and retrieve unique documents from base_retriever.

    - base_retriever: object supporting get_relevant_documents/_get_relevant_documents/invoke
    - llm: BaseChatModel used to generate alternative queries
    - user_query: original query
    - num_queries: how many alternative rewrites to ask for (LLM may return fewer)
    - k_per_query: limit docs per query (post-fetch trimming)
    """
    alt_queries = generate_alternative_queries(llm, user_query, num_queries=num_queries,k_per_query=k_per_query)
    queries = [user_query] + alt_queries

    all_docs: List[Document] = []
    seen_keys: Set[Tuple[str, Tuple[Tuple[str, str], ...]]] = set()

    def process_query(i: int, q: str) -> List[Document]:
        print(f"[multi_query_retrieve] query #{i}: {q[:200]!r}")
        try:
            return _call_retriever(base_retriever, q) or []
        except Exception:
            traceback.print_exc()
            return []

    # Use ThreadPoolExecutor for parallel retrieval
    with ThreadPoolExecutor(max_workers=min(len(queries), 8)) as executor:
        results = list(executor.map(lambda p: process_query(*p), enumerate(queries)))

    for i, docs in enumerate(results):
        if not docs:
            print(f"[multi_query_retrieve] No documents returned for query #{i}.")
            continue

        docs = docs[:k_per_query]
        print(f"[multi_query_retrieve] Retrieved {len(docs)} docs for query #{i} (trimmed to {k_per_query}).")

        for d in docs:
            meta_items = tuple(sorted((k, str(v)) for k, v in (d.metadata or {}).items()))
            key = (d.page_content or "", meta_items)
            if key not in seen_keys:
                seen_keys.add(key)
                all_docs.append(d)

    print(f"[multi_query_retrieve] Total unique documents collected: {len(all_docs)}")
    return all_docs
