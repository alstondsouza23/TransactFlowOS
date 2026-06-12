"""
RAG/sync/pinecone_store.py
Pinecone client — upsert, delete, and query vectors.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME

from pinecone import Pinecone

_pc    = Pinecone(api_key=PINECONE_API_KEY)
_index = _pc.Index(PINECONE_INDEX_NAME)


def upsert_vector(vector_id: str, embedding: list[float], metadata: dict, text: str) -> None:
    """
    Upsert one vector. The text is stored inside metadata as 'text_content'
    so we can return it on query without a separate Firestore lookup.
    """
    # Pinecone metadata values must be str / int / float / bool — coerce anything else
    safe = {
        k: (str(v) if not isinstance(v, (str, int, float, bool)) else v)
        for k, v in metadata.items()
        if v is not None and v != ""
    }
    safe["text_content"] = text[:3000]  # ~3 k chars fits comfortably in metadata

    _index.upsert(vectors=[{
        "id":       vector_id,
        "values":   embedding,
        "metadata": safe,
    }])


def delete_vector(vector_id: str) -> None:
    """Remove a vector when the Firestore document is deleted."""
    try:
        _index.delete(ids=[vector_id])
    except Exception as e:
        print(f"[pinecone] Delete failed {vector_id}: {e}")


def query_vectors(
    embedding: list[float],
    top_k: int = 6,
    filter_dict: dict | None = None,
) -> list[dict]:
    """
    Nearest-neighbour search.
    Returns: [{ id, score, text, meta }]
    """
    res = _index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict,
    )
    chunks = []
    for match in res.matches:
        meta = dict(match.metadata or {})
        text = meta.pop("text_content", "")
        chunks.append({
            "id":    match.id,
            "score": match.score,
            "text":  text,
            "meta":  meta,
        })
    return chunks


def index_stats() -> dict:
    return _index.describe_index_stats().to_dict()
