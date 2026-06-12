"""
RAG/sync/embedder.py
Generates text embeddings via direct HTTP to the Gemini REST API.

Why direct HTTP instead of an SDK?
- google-genai:          calls v1beta batchEmbedContents → 404 for text-embedding-004
- google-generativeai:   same underlying issue
- Direct embedContent:   v1 REST endpoint → works correctly with AQ. format keys

Model: text-embedding-004  (768 dimensions)
"""

import asyncio
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import GEMINI_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIM

import httpx

_MODEL_ID    = EMBEDDING_MODEL.replace("models/", "")  # e.g. gemini-embedding-001
_EMBED_URL_V1  = f"https://generativelanguage.googleapis.com/v1/models/{_MODEL_ID}:embedContent"
_EMBED_URL_V1B = f"https://generativelanguage.googleapis.com/v1beta/models/{_MODEL_ID}:embedContent"
_HEADERS       = {"x-goog-api-key": GEMINI_API_KEY}

_TASK_MAP = {
    "retrieval_document": "RETRIEVAL_DOCUMENT",
    "retrieval_query":    "RETRIEVAL_QUERY",
    "RETRIEVAL_DOCUMENT": "RETRIEVAL_DOCUMENT",
    "RETRIEVAL_QUERY":    "RETRIEVAL_QUERY",
}


async def _call_embed(text: str, task_type: str) -> list[float]:
    """
    Call the Gemini embedContent REST endpoint.
    Tries v1 first, then v1beta as a fallback.
    """
    payload = {
        "model": EMBEDDING_MODEL,
        "content": {"parts": [{"text": text}]},
        "taskType": _TASK_MAP.get(task_type, "RETRIEVAL_DOCUMENT"),
        "outputDimensionality": EMBEDDING_DIM,   # 768 — Matryoshka truncation
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Try v1 first
        resp = await client.post(_EMBED_URL_V1, json=payload, headers=_HEADERS)
        if resp.status_code == 404:
            # Fall back to v1beta
            resp = await client.post(_EMBED_URL_V1B, json=payload, headers=_HEADERS)
        resp.raise_for_status()
        data = resp.json()
        return data["embedding"]["values"]


async def embed_text(text: str) -> list[float]:
    """Embed a document chunk for storage."""
    return await _call_embed(text, "RETRIEVAL_DOCUMENT")


async def embed_query(text: str) -> list[float]:
    """Embed a search query (higher accuracy at retrieval time)."""
    return await _call_embed(text, "RETRIEVAL_QUERY")


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed multiple texts with gentle rate-limit pausing.
    Returns a parallel list of embeddings (same order as input).
    """
    results = []
    batch_size = 5
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        batch_results = await asyncio.gather(
            *[embed_text(t) for t in batch],
            return_exceptions=True,
        )
        for r in batch_results:
            if isinstance(r, Exception):
                print(f"[embedder] Batch error: {r}")
                results.append([0.0] * EMBEDDING_DIM)
            else:
                results.append(r)
        if i + batch_size < len(texts):
            await asyncio.sleep(0.5)   # stay within free-tier RPM limit
    return results
