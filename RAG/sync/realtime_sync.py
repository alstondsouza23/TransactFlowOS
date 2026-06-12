"""
RAG/sync/realtime_sync.py
Registers Firestore onSnapshot listeners for all collections.
Every document change → re-embed → upsert (or delete) in Pinecone.
"""

import asyncio
import logging

log = logging.getLogger("rag.sync")


def setup_sync_listeners(db, loop: asyncio.AbstractEventLoop) -> list:
    """
    Attach onSnapshot listeners to all configured Firestore collections.
    Returns a list of unsubscribe callables for clean shutdown.
    """
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from config import COLLECTIONS_TO_SYNC

    unsubs = []
    for col in COLLECTIONS_TO_SYNC:
        unsub = db.collection(col).on_snapshot(_make_listener(col, loop))
        unsubs.append(unsub)
        log.info(f"  👂 Listening: /{col}")
    return unsubs


def _make_listener(collection: str, loop: asyncio.AbstractEventLoop):
    """Return a Firestore snapshot callback for the given collection."""

    def _on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            doc_id = change.document.id
            data   = change.document.to_dict() or {}

            if change.type.name == "REMOVED":
                vector_id = f"{collection}_{doc_id}"
                asyncio.run_coroutine_threadsafe(_delete(vector_id), loop)
            else:
                asyncio.run_coroutine_threadsafe(
                    _upsert(collection, doc_id, data), loop
                )

    return _on_snapshot


async def _upsert(collection: str, doc_id: str, data: dict) -> None:
    from sync.doc_processor import process_document
    from sync.embedder import embed_text
    from sync.pinecone_store import upsert_vector
    try:
        chunk = process_document(collection, doc_id, data)
        if chunk is None:
            return
        emb = await embed_text(chunk["text"])
        upsert_vector(chunk["id"], emb, chunk["metadata"], chunk["text"])
        log.info(f"  ↑ Synced {collection}/{doc_id}")
    except Exception as e:
        log.error(f"  ✖ Sync error {collection}/{doc_id}: {e}")


async def _delete(vector_id: str) -> None:
    from sync.pinecone_store import delete_vector
    try:
        delete_vector(vector_id)
        log.info(f"  ✗ Deleted {vector_id}")
    except Exception as e:
        log.error(f"  ✖ Delete error {vector_id}: {e}")
