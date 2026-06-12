"""
RAG/sync/embedder.py
Generates text embeddings using Gemini gemini-embedding-exp-03-07 (1024 dimensions).
Runs embedding calls in a thread pool so the async loop is never blocked.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import GEMINI_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIM

from google import genai
from google.genai import types

_client = genai.Client(api_key=GEMINI_API_KEY)


def _embed_sync(text: str, task_type: str) -> list[float]:
    """Blocking Gemini embedding call — runs inside a thread executor."""
    response = _client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=EMBEDDING_DIM,
        ),
    )
    return list(response.embeddings[0].values)


async def embed_text(text: str) -> list[float]:
    """Embed a document chunk for storage (RETRIEVAL_DOCUMENT task)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _embed_sync, text, "RETRIEVAL_DOCUMENT")


async def embed_query(text: str) -> list[float]:
    """Embed a user search query (RETRIEVAL_QUERY task — better retrieval)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _embed_sync, text, "RETRIEVAL_QUERY")


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts in small batches to avoid rate-limiting.
    Returns a parallel list of embeddings.
    """
    results = []
    batch_size = 5
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        tasks = [embed_text(t) for t in batch]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in batch_results:
            if isinstance(r, Exception):
                print(f"[embedder] Batch embedding error: {r}")
                results.append([0.0] * EMBEDDING_DIM)
            else:
                results.append(r)
        if i + batch_size < len(texts):
            await asyncio.sleep(0.3)  # gentle rate-limit pause
    return results
