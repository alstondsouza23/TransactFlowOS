"""
RAG/chat/rag_pipeline.py
Full RAG pipeline:
  1. Embed user query (RETRIEVAL_QUERY task)
  2. Search Pinecone with access-control metadata filter
  3. Build context prompt from retrieved chunks
  4. Stream Gemini 1.5 Flash response token-by-token
"""

import logging
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import GEMINI_API_KEY, GENERATION_MODEL

from google import genai
from google.genai import types
from sync.embedder import embed_query
from sync.pinecone_store import query_vectors

log     = logging.getLogger("rag.chat")
_client = genai.Client(api_key=GEMINI_API_KEY)

# ── System prompts ────────────────────────────────────────────────

_MEMBER_SYSTEM = """You are a helpful financial assistant for TransactFlowOS — a community savings and loan platform (chit fund).
Your job is to help members understand their account, KYC status, loans, auctions, and bids.

Rules:
- Answer ONLY based on the context provided below. Do not invent data.
- If the context lacks information, say "I don't have that information in the system right now."
- Be concise, friendly, and professional.
- Format Indian currency as ₹X,XX,XXX (e.g. ₹5,25,252).
- Never reveal other members' private information.
"""

_STAFF_SYSTEM = """You are an AI assistant for TransactFlowOS employees and administrators.
You help staff review KYC submissions, loan applications, recovery cases, auction results, and audit logs.

Rules:
- Answer ONLY based on the context provided. Do not invent data.
- Be precise, data-driven, and professional.
- Format Indian currency as ₹X,XX,XXX.
- You have access to all member data.
"""


# ── Access filter ─────────────────────────────────────────────────

def _build_filter(uid: str, group_id: str | None, is_staff: bool) -> dict | None:
    """
    Pinecone metadata filter that enforces data-access rules:
    - Staff: no filter (see everything)
    - Member: see own docs + group-visible docs in their group
    """
    if is_staff:
        return None  # no restriction

    # Member can see: own docs OR group-wide docs in their group
    if group_id:
        return {
            "$or": [
                {"uid": {"$eq": uid}},
                {
                    "$and": [
                        {"access":   {"$in": ["group"]}},
                        {"group_id": {"$eq": group_id}},
                    ]
                },
            ]
        }
    # No group yet: only own docs
    return {"uid": {"$eq": uid}}


# ── Main pipeline ─────────────────────────────────────────────────

async def stream_rag_response(
    user_message: str,
    uid: str,
    group_id: str | None,
    is_staff: bool,
    chat_history: list[dict],
):
    """
    Async generator that yields text chunks as Gemini streams them.
    chat_history: [{ "role": "user"|"model", "content": "..." }]
    """
    log.info(f"[rag] uid={uid} staff={is_staff} q={user_message[:60]!r}")

    # 1. Embed query
    try:
        q_emb = await embed_query(user_message)
    except Exception as e:
        log.error(f"[rag] Embed failed: {e}")
        yield "⚠️ Could not process your message right now. Please try again."
        return

    # 2. Retrieve relevant chunks from Pinecone
    try:
        chunks = query_vectors(
            embedding=q_emb,
            top_k=6,
            filter_dict=_build_filter(uid, group_id, is_staff),
        )
    except Exception as e:
        log.error(f"[rag] Pinecone query failed: {e}")
        yield "⚠️ Could not retrieve data right now. Please try again."
        return

    # 3. Build context (only include chunks with meaningful similarity)
    ctx_parts = [
        f"[{i+1}] {c['text']}"
        for i, c in enumerate(chunks)
        if c.get("score", 0) > 0.35 and c.get("text")
    ]
    context = "\n\n".join(ctx_parts) if ctx_parts else "No relevant records found in the database."

    # 4. Assemble conversation history for multi-turn chat
    history = []
    for msg in chat_history[-8:]:  # last 4 turns
        history.append(types.Content(
            role=msg["role"],
            parts=[types.Part(text=msg["content"])],
        ))

    # Final user turn includes retrieved context + question
    full_user_turn = (
        f"Context from TransactFlowOS database:\n{context}\n\n"
        f"My question: {user_message}"
    )

    # 5. Stream Gemini 1.5 Flash response
    system = _STAFF_SYSTEM if is_staff else _MEMBER_SYSTEM
    try:
        stream = await _client.aio.models.generate_content_stream(
            model=GENERATION_MODEL,
            contents=history + [
                types.Content(
                    role="user",
                    parts=[types.Part(text=full_user_turn)],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.25,
                max_output_tokens=1024,
            ),
        )
        async for chunk in stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        log.error(f"[rag] Generation error: {e}")
        yield f"\n\n⚠️ Response generation failed: {e}"
