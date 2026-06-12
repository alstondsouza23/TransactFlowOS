/**
 * src/components/ChatWidget.jsx — Employee Admin Desktop
 *
 * Floating AI chatbot — staff role gives access to ALL member data.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '../firebase/firebaseConfig';
import useAuthStore from '../store/authStore';

const RAG_WS_URL = import.meta.env.VITE_RAG_WS_URL || 'ws://localhost:8081';

// ── Helpers ───────────────────────────────────────────────────────
const mkId = () => Math.random().toString(36).slice(2, 9);

// ── Markdown-lite: bold, code, newlines ──────────────────────────
function renderText(text) {
  return text
    .split('\n')
    .map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('`') && part.endsWith('`'))
            return <code key={j} style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>{part.slice(1, -1)}</code>;
          return part;
        })}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
}

// ── Suggested prompts for first-time users ────────────────────────
const SUGGESTIONS = [
  'Show me all pending KYC submissions.',
  'Who are the members in recovery stage?',
  'What was the last auction result?',
  'List members with pending loan applications.',
];

// ── Main component ────────────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuthStore();
  const uid = user?.uid;

  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([
    { id: mkId(), role: 'ai', text: 'Hi! I\'m your TransactFlowOS assistant. Ask me about your account, loans, KYC, or auctions.', done: true },
  ]);
  const [input,     setInput]     = useState('');
  const [status,    setStatus]    = useState('disconnected'); // disconnected | connecting | ready | error
  const [streaming, setStreaming] = useState(false);

  const wsRef      = useRef(null);
  const retryRef   = useRef(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const mounted    = useRef(true);

  // ── Connect ───────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!uid || !mounted.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const user = auth.currentUser;
    if (!user) return;

    let token;
    try { token = await user.getIdToken(false); }
    catch { setStatus('error'); return; }

    const ws = new WebSocket(RAG_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token, role: 'employee' }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.type === 'ready') {
          setStatus('ready');
          return;
        }

        if (msg.type === 'auth_failed') {
          setStatus('error');
          return;
        }

        if (msg.type === 'chunk') {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'ai' && !last.done) {
              return [...prev.slice(0, -1), { ...last, text: last.text + msg.content }];
            }
            return [...prev, { id: mkId(), role: 'ai', text: msg.content, done: false }];
          });
        }

        if (msg.type === 'done') {
          setStreaming(false);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'ai') return [...prev.slice(0, -1), { ...last, done: true }];
            return prev;
          });
        }

        if (msg.type === 'error') {
          setStreaming(false);
          setMessages((prev) => [
            ...prev,
            { id: mkId(), role: 'ai', text: '⚠️ ' + (msg.content || 'Something went wrong.'), done: true, isError: true },
          ]);
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => setStatus('error');

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
      if (mounted.current) {
        retryRef.current = setTimeout(connect, 4000);
      }
    };
  }, [uid]);

  useEffect(() => {
    mounted.current = true;
    if (open) connect();
    return () => {
      mounted.current = false;
      clearTimeout(retryRef.current);
    };
  }, [open, connect]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // ── Send message ──────────────────────────────────────────────
  const send = useCallback((text) => {
    const content = (text || input).trim();
    if (!content || streaming || status !== 'ready') return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    setMessages((prev) => [...prev, { id: mkId(), role: 'user', text: content, done: true }]);
    setInput('');
    setStreaming(true);

    ws.send(JSON.stringify({ type: 'message', content }));
  }, [input, streaming, status]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Status color ──────────────────────────────────────────────
  const dot = {
    disconnected: '#94a3b8',
    connecting:   '#F59E0B',
    ready:        '#22C55E',
    error:        '#EF4444',
  }[status];

  const showSuggestions = messages.length === 1 && status === 'ready';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="AI Assistant"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a2f55 0%, #2E6DAD 100%)',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(26,47,85,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, transition: 'transform 0.2s ease',
          transform: open ? 'rotate(45deg) scale(1.1)' : 'scale(1)',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 8999,
          width: 380, height: 560,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          fontFamily: '"Inter", sans-serif', overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'chat-open 0.2s ease',
        }}>
          <style>{`
            @keyframes chat-open {
              from { opacity: 0; transform: translateY(12px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes typing-dot {
              0%,80%,100% { opacity:0.2; transform:scale(0.8); }
              40%         { opacity:1;   transform:scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #1a2f55, #2E6DAD)',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 22 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>AI Assistant</div>
              <div style={{ fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                {{ disconnected: 'Disconnected', connecting: 'Connecting…', ready: 'Online', error: 'Error' }[status]}
              </div>
            </div>
            <button
              onClick={() => setMessages([{ id: mkId(), role: 'ai', text: 'Hi! How can I help you today?', done: true }])}
              title="Clear chat"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, padding: 4 }}
            >🗑</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 8,
              }}>
                {m.role === 'ai' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a2f55, #2E6DAD)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0,
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '10px 13px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #1a2f55, #2E6DAD)'
                    : m.isError ? '#FEE2E2' : '#F8FAFC',
                  color: m.role === 'user' ? '#fff' : m.isError ? '#DC2626' : '#1e293b',
                  fontSize: 13.5, lineHeight: 1.55, fontWeight: 450,
                  border: m.role === 'ai' && !m.isError ? '1px solid #E2E8F0' : 'none',
                }}>
                  {m.text ? renderText(m.text) : (
                    // Typing indicator
                    <span style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} style={{
                          width: 6, height: 6, borderRadius: '50%', background: '#94a3b8',
                          animation: `typing-dot 1.2s infinite ${i * 0.2}s`,
                          display: 'inline-block',
                        }} />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming indicator */}
            {streaming && messages[messages.length - 1]?.role !== 'ai' && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a2f55, #2E6DAD)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}>🤖</div>
                <div style={{
                  padding: '10px 14px', borderRadius: '4px 18px 18px 18px',
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                }}>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#94a3b8',
                        animation: `typing-dot 1.2s infinite ${i * 0.2}s`,
                        display: 'inline-block',
                      }} />
                    ))}
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          {showSuggestions && (
            <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    padding: '5px 10px', borderRadius: 100,
                    border: '1px solid #CBD5E1', background: '#F8FAFC',
                    fontSize: 11, fontWeight: 600, color: '#475569',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            borderTop: '1px solid #E2E8F0',
            padding: '10px 14px',
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: '#fff',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={status === 'ready' ? 'Ask me anything…' : 'Connecting…'}
              disabled={status !== 'ready' || streaming}
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid #E2E8F0',
                borderRadius: 10, padding: '9px 12px', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', lineHeight: 1.4,
                background: status !== 'ready' ? '#F8FAFC' : '#fff',
                color: '#1e293b', maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming || status !== 'ready'}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: (!input.trim() || streaming || status !== 'ready')
                  ? '#E2E8F0'
                  : 'linear-gradient(135deg, #1a2f55, #2E6DAD)',
                border: 'none', cursor: (!input.trim() || streaming || status !== 'ready') ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0, transition: 'all 0.15s',
                boxShadow: (!input.trim() || streaming || status !== 'ready') ? 'none' : '0 2px 8px rgba(26,47,85,0.3)',
              }}
            >
              ➤
            </button>
          </div>

          {/* Footer */}
          <div style={{
            padding: '4px 14px 8px', fontSize: 10, color: '#94a3b8',
            textAlign: 'center', background: '#fff',
          }}>
            Powered by Gemini · RAG over your Firestore data
          </div>
        </div>
      )}
    </>
  );
}
