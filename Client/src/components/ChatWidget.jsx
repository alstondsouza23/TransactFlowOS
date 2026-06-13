/**
 * src/components/ChatWidget.jsx — Client (Member Portal)
 *
 * Fully offline predefined Q&A chatbot.
 * No WebSocket, no RAG server — keyword-matched answers only.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const mkId = () => Math.random().toString(36).slice(2, 9);

// ── Predefined Q&A knowledge base ────────────────────────────────
const QA = [
  {
    keywords: ['kyc', 'verify', 'verification', 'document', 'pan', 'identity'],
    answer: `**KYC (Know Your Customer)** is a one-time verification process.\n\n**Steps to complete KYC:**\n1. Go to **My Overview** and click "Submit KYC"\n2. Upload your **PAN card** and **bank passbook**\n3. Submit — an employee will review within 24 hours\n\nOnce approved your status changes to **Verified** and you become eligible for loans.`,
  },
  {
    keywords: ['loan', 'apply', 'application', 'borrow', 'emi', 'interest', 'repay'],
    answer: `**Loan Application Process:**\n\n1. Complete KYC first (required)\n2. Go to the **Loans** page → click "Apply for Loan"\n3. Fill in the amount, purpose, and tenure\n4. An employee reviews your application\n\n**Interest Rate:** 12% per annum (reducing balance)\n**Tenure options:** 6, 12, 18, or 24 months\n\nEMI is auto-calculated using the standard reducing-balance formula.`,
  },
  {
    keywords: ['auction', 'bid', 'pot', 'chit', 'cycle', 'win'],
    answer: `**How Auctions Work:**\n\nTransactFlowOS runs a chit-fund style auction each cycle.\n\n- All members contribute monthly to build the **pot**\n- The **Auction Room** opens on the scheduled date\n- Members place bids — **highest bid wins the pot**\n- The winner receives the full pot amount and cannot bid again in future cycles\n\nCheck the **Auction Room** page to see the next scheduled auction!`,
  },
  {
    keywords: ['contribution', 'payment', 'paid', 'due', 'monthly', 'installment'],
    answer: `**Monthly Contributions:**\n\nEvery group member contributes a fixed amount each month to build the group pot.\n\n- View your contribution history on the **Contributions** page\n- Contributions are recorded automatically when processed\n- Missing a contribution may affect your loan eligibility\n\nContact your group admin if you see any discrepancies.`,
  },
  {
    keywords: ['group', 'members', 'grp', 'team', 'cycle'],
    answer: `**Your Group (GRP-001):**\n\nTransactFlowOS organises members into savings groups.\n\n- View all group members on the **Group Overview** page\n- See each member's contribution status and loan history\n- The group's collective savings form the auction pot each month\n\nGroup size and cycle details are managed by your admin.`,
  },
  {
    keywords: ['risk', 'score', 'analysis', 'credit', 'ai', 'assessment'],
    answer: `**AI Risk Analysis:**\n\nTransactFlowOS uses an AI model to compute your **Risk Score** (0–1000).\n\n- **Lower score** = lower risk = better loan terms\n- Score is based on payment history, group participation, and loan repayment\n- View your full risk profile on the **Risk Analysis** page\n\nThe model is updated periodically based on your latest activity.`,
  },
  {
    keywords: ['account', 'profile', 'status', 'type', 'eligible', 'user'],
    answer: `**Account Types in TransactFlowOS:**\n\n| Status | Meaning |\n|---|---|\n| **KYC Pending** | Verification not yet submitted or under review |\n| **Verified / Loan Eligible** | KYC approved — can apply for loans |\n| **Contributor** | Active loan holder |\n\nCheck your current status on the **My Overview** page.`,
  },
  {
    keywords: ['password', 'login', 'signin', 'sign in', 'access', 'forgot'],
    answer: `**Login & Access:**\n\nTransactFlowOS uses **Google / Email sign-in** via Firebase Auth.\n\nIf you can't log in:\n- Make sure you're using the correct email address\n- Use the **"Forgot Password"** link on the login page\n- Contact your group admin if your account is locked\n\nYour session stays active for 7 days.`,
  },
  {
    keywords: ['contact', 'support', 'help', 'admin', 'employee', 'reach'],
    answer: `**Need Help?**\n\nFor account issues, reach your group admin or employee:\n\n- 📧 **admin@transactflow.in**\n- 🕐 Support hours: Mon–Fri, 9 AM – 6 PM IST\n\nFor urgent issues related to auctions or loan disbursement, contact support immediately.`,
  },
  {
    keywords: ['withdraw', 'cashout', 'disburse', 'transfer', 'money', 'fund'],
    answer: `**Fund Disbursement:**\n\nWhen your loan is approved or you win an auction:\n\n- Funds are disbursed to your **registered bank account**\n- Processing takes **1–2 business days**\n- You'll receive a confirmation notification\n\nMake sure your bank details in your profile are up to date.`,
  },
  {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'howdy'],
    answer: `Hello! 👋 I'm your **TransactFlowOS assistant**.\n\nI can help you with:\n- KYC verification\n- Loan applications & EMI\n- Auction & bidding\n- Contributions & payments\n- Risk score & analysis\n- Account & profile\n\nWhat would you like to know?`,
  },
  {
    keywords: ['thank', 'thanks', 'appreciate', 'great', 'helpful'],
    answer: `You're welcome! 😊 Feel free to ask if you have any more questions. I'm here to help anytime!`,
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'later', 'exit'],
    answer: `Goodbye! 👋 Have a great day. Come back anytime you need help with your TransactFlowOS account.`,
  },
];

const FALLBACK = `I'm not sure about that specific question. Here are some things I **can** help with:\n\n- 📋 KYC verification process\n- 💰 Loan applications & EMI calculation\n- 🏷️ Auction room & bidding\n- 📊 Risk score & analysis\n- 💳 Monthly contributions\n- 👥 Group overview\n\nTry asking about one of these topics!`;

// Quick-reply suggestions shown at start
const SUGGESTIONS = [
  'How does the auction work?',
  'How do I apply for a loan?',
  'What is KYC?',
  'How is my risk score calculated?',
  'What is my account type?',
  'How do contributions work?',
];

// ── Match a question to the best answer ──────────────────────────
function findAnswer(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const qa of QA) {
    const score = qa.keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = qa;
    }
  }

  return bestScore > 0 ? best.answer : FALLBACK;
}

// ── Markdown-lite renderer ────────────────────────────────────────
function renderText(text) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={j} style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>{part.slice(1, -1)}</code>;
        return part;
      })}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ── Main component ─────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { id: mkId(), role: 'ai', text: "Hi! 👋 I'm your **TransactFlowOS assistant**.\n\nAsk me about loans, KYC, auctions, contributions, or your account.", done: true },
  ]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const showSuggestions = messages.length === 1;

  // ── Send / receive ───────────────────────────────────────────────
  const send = useCallback((text) => {
    const content = (text || input).trim();
    if (!content || typing) return;

    // Add user message
    setMessages((prev) => [...prev, { id: mkId(), role: 'user', text: content, done: true }]);
    setInput('');
    setTyping(true);

    // Simulate typing delay (400–900ms)
    const delay = 400 + Math.random() * 500;
    setTimeout(() => {
      const answer = findAnswer(content);
      setMessages((prev) => [...prev, { id: mkId(), role: 'ai', text: answer, done: true }]);
      setTyping(false);
    }, delay);
  }, [input, typing]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([{ id: mkId(), role: 'ai', text: "Chat cleared! What would you like to know?", done: true }]);
    setTyping(false);
  };

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
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(26,47,85,0.4)',
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
              <div style={{ fontSize: 11, opacity: 0.75 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', marginRight: 5 }} />
                Always online
              </div>
            </div>
            <button
              onClick={clearChat}
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
                    : '#F8FAFC',
                  color: m.role === 'user' ? '#fff' : '#1e293b',
                  fontSize: 13.5, lineHeight: 1.6, fontWeight: 450,
                  border: m.role === 'ai' ? '1px solid #E2E8F0' : 'none',
                }}>
                  {renderText(m.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a2f55, #2E6DAD)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}>🤖</div>
                <div style={{
                  padding: '12px 14px', borderRadius: '4px 18px 18px 18px',
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

          {/* Suggestion chips */}
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
                  onMouseOver={(e) => { e.target.style.background = '#1a2f55'; e.target.style.color = '#fff'; e.target.style.borderColor = '#1a2f55'; }}
                  onMouseOut={(e) => { e.target.style.background = '#F8FAFC'; e.target.style.color = '#475569'; e.target.style.borderColor = '#CBD5E1'; }}
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
              placeholder="Ask me anything…"
              disabled={typing}
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid #E2E8F0',
                borderRadius: 10, padding: '9px 12px', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', lineHeight: 1.4,
                background: '#fff', color: '#1e293b',
                maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: (!input.trim() || typing) ? '#E2E8F0' : 'linear-gradient(135deg, #1a2f55, #2E6DAD)',
                border: 'none',
                cursor: (!input.trim() || typing) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0, transition: 'all 0.15s',
                boxShadow: (!input.trim() || typing) ? 'none' : '0 2px 8px rgba(26,47,85,0.3)',
              }}
            >
              ➤
            </button>
          </div>

          {/* Footer */}
          <div style={{ padding: '4px 14px 8px', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
            TransactFlowOS Assistant · Always available
          </div>
        </div>
      )}
    </>
  );
}
