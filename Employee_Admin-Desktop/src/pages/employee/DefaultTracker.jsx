/**
 * src/pages/employee/DefaultTracker.jsx
 *
 * Recovery Tracker — Kanban board of defaulters.
 * Data comes from wsStore.recoveryCases (live from Firestore via WS).
 * "Move Stage" sends an action to the backend → Firestore updated → broadcast.
 */

import React, { useState, useCallback } from 'react';
import {
  Bell,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Clock,
  User,
  Phone,
  MessageSquare,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useWsStore from '../../store/wsStore';
import { useWsAction } from '../../providers/WebSocketProvider';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'Overdue_1_5',   label: 'Overdue (1-5)',    color: 'bg-blue-400',   nextStage: 'Warning_5_15' },
  { key: 'Warning_5_15',  label: 'Warning (5-15)',   color: 'bg-amber-400',  nextStage: 'Critical_15_30' },
  { key: 'Critical_15_30',label: 'Critical (15-30)', color: 'bg-rose-500',   nextStage: 'Legal_NPR' },
  { key: 'Legal_NPR',     label: 'Legal / NPR',      color: 'bg-slate-800',  nextStage: null },
];

const RISK_COLORS = {
  High:   'text-rose-500 bg-rose-50 border-rose-100',
  Medium: 'text-amber-500 bg-amber-50 border-amber-100',
  Low:    'text-emerald-500 bg-emerald-50 border-emerald-100',
};

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────
function fmtInr(amount) {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('en-IN');
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function RecoveryCard({ doc, nextStage }) {
  const { sendAction } = useWsAction();
  const [moving, setMoving]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMoveStage = useCallback(() => {
    if (!nextStage || moving) return;
    setMoving(true);
    sendAction({
      channel: 'recovery_board',
      action:  'move_stage',
      payload: { id: doc.id, new_stage: nextStage },
    });
    // Optimistic reset — real update comes via WS broadcast
    setTimeout(() => setMoving(false), 2000);
  }, [doc.id, nextStage, sendAction, moving]);

  const stageLabel = STAGES.find((s) => s.nextStage === nextStage)?.label;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${RISK_COLORS[doc.risk_level] ?? RISK_COLORS.Low}`}>
          {doc.risk_level} Risk
        </span>
        <div className="relative">
          <button
            className="text-slate-300 hover:text-slate-600"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && nextStage && (
            <div
              className="absolute right-0 top-6 z-20 bg-white border border-slate-100 shadow-lg rounded-xl p-2 min-w-[160px]"
              onBlur={() => setMenuOpen(false)}
            >
              <button
                onClick={() => { handleMoveStage(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                <ChevronRight size={13} />
                Escalate Stage
              </button>
            </div>
          )}
        </div>
      </div>

      <h4 className="text-sm font-bold text-slate-700 mb-1">{doc.member_name}</h4>
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-4">
        <span className="text-slate-800">₹ {fmtInr(doc.overdue_amount_inr)}</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Clock size={10} /> {doc.days_late} days late</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
            <User size={12} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {moving ? (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          ) : (
            <>
              <button className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all">
                <Phone size={14} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all">
                <MessageSquare size={14} />
              </button>
              {nextStage && (
                <button
                  onClick={handleMoveStage}
                  title={`Move to next stage`}
                  className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all text-[10px] font-bold"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const BoardColumn = ({ stage, cards }) => {
  const stageConfig = STAGES.find((s) => s.key === stage.key);

  return (
    <div className="flex-1 min-w-[280px] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stageConfig?.color}`} />
          <h3 className="text-sm font-black text-slate-700 tracking-tight uppercase">{stage.label}</h3>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50 space-y-3 overflow-y-auto no-scrollbar">
        {cards.length === 0 ? (
          <p className="text-center text-slate-400 text-[11px] font-medium pt-6">No cases</p>
        ) : (
          cards.map((doc) => (
            <RecoveryCard key={doc.id} doc={doc} nextStage={stage.nextStage} />
          ))
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export default function DefaultTracker() {
  const connected     = useWsStore((s) => s.connected);
  const recoveryCases = useWsStore((s) => s.recoveryCases);
  const [search, setSearch] = useState('');

  // Group cases into Kanban columns
  const filtered = recoveryCases.filter((c) =>
    !search || c.member_name?.toLowerCase().includes(search.toLowerCase())
  );

  const byStage = (stageKey) => filtered.filter((c) => c.recovery_stage === stageKey);

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="Recovery" />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full shrink-0">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Recovery Tracker</h1>
            <div className="flex items-center gap-4">
              {!connected && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                  <Loader2 size={11} className="animate-spin" /> Reconnecting…
                </div>
              )}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 shadow-sm focus:border-brand-blue/20 transition-all"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group border border-slate-100/50 shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse" />
              </button>
            </div>
          </header>

          <main className="p-8 space-y-6 h-[calc(100vh-64px-40px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-[#1a2f55] tracking-tight">Recovery Pipeline</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  {recoveryCases.length} cases loaded — real-time Firestore sync
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  <Filter size={14} /> View: All
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1a2f55] text-white rounded-xl text-xs font-bold hover:bg-[#142445] transition-all shadow-lg shadow-brand-blue/10">
                  <Plus size={14} /> New Case
                </button>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar min-h-0">
              {recoveryCases.length === 0 && !connected ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">
                  Backend offline — start with: <code className="ml-2 bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">cd Backend &amp;&amp; python main.py</code>
                </div>
              ) : (
                STAGES.map((stage) => (
                  <BoardColumn key={stage.key} stage={stage} cards={byStage(stage.key)} />
                ))
              )}
            </div>
          </main>
        </div>

        <KernelMonitor />
      </div>
    </div>
  );
}
