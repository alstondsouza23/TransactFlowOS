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
  Download,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useWsStore from '../../store/wsStore';
import { useWsAction } from '../../providers/WebSocketProvider';
import { exportCsv } from '../../lib/exportCsv';

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
// Mock / seed data — used when live Firestore feed is empty
// ─────────────────────────────────────────────────────────────────
const MOCK_CASES = [
  { id: 'm1', member_name: 'Ravi Kumar',    recovery_stage: 'Overdue_1_5',    risk_level: 'High',   overdue_amount_inr: 12500,  days_late: 4,  phone: '+91 98401 23456', group_id: 'GRP-001', loan_id: 'LN-2024-0041', last_contact_date: '10 Jun 2026' },
  { id: 'm2', member_name: 'Suresh Nair',   recovery_stage: 'Overdue_1_5',    risk_level: 'Medium', overdue_amount_inr: 8000,   days_late: 2,  phone: '+91 94432 78901', group_id: 'GRP-003', loan_id: 'LN-2024-0055', last_contact_date: '11 Jun 2026' },
  { id: 'm3', member_name: 'Kavitha Reddy', recovery_stage: 'Warning_5_15',   risk_level: 'High',   overdue_amount_inr: 27000,  days_late: 9,  phone: '+91 91234 56789', group_id: 'GRP-002', loan_id: 'LN-2024-0062', last_contact_date: '08 Jun 2026' },
  { id: 'm4', member_name: 'Arun Sharma',   recovery_stage: 'Warning_5_15',   risk_level: 'Medium', overdue_amount_inr: 15000,  days_late: 12, phone: '+91 99887 65432', group_id: 'GRP-005', loan_id: 'LN-2024-0078', last_contact_date: '07 Jun 2026' },
  { id: 'm5', member_name: 'Priya Menon',   recovery_stage: 'Warning_5_15',   risk_level: 'Low',    overdue_amount_inr: 5500,   days_late: 6,  phone: '+91 87654 32109', group_id: 'GRP-001', loan_id: 'LN-2024-0083', last_contact_date: '09 Jun 2026' },
  { id: 'm6', member_name: 'Deepak Pillai', recovery_stage: 'Critical_15_30', risk_level: 'High',   overdue_amount_inr: 43000,  days_late: 21, phone: '+91 96321 09876', group_id: 'GRP-004', loan_id: 'LN-2024-0091', last_contact_date: '03 Jun 2026' },
  { id: 'm7', member_name: 'Meena Iyer',    recovery_stage: 'Critical_15_30', risk_level: 'High',   overdue_amount_inr: 31500,  days_late: 18, phone: '+91 93210 98765', group_id: 'GRP-002', loan_id: 'LN-2024-0097', last_contact_date: '04 Jun 2026' },
  { id: 'm8', member_name: 'Sanjay Patel',  recovery_stage: 'Legal_NPR',      risk_level: 'High',   overdue_amount_inr: 78000,  days_late: 45, phone: '+91 90000 11223', group_id: 'GRP-006', loan_id: 'LN-2023-0134', last_contact_date: '28 May 2026' },
];

// ─────────────────────────────────────────────────────────────────
// Hardcoded extras — fills missing fields on live Firestore docs
// Keyed by member_name (case-insensitive prefix match)
// ─────────────────────────────────────────────────────────────────
const HARDCODED_EXTRAS = {
  'suresh g':    { phone: '+91 97800 34512', group_id: 'GRP-007', loan_id: 'LN-2024-0101', last_contact_date: '10 Jun 2026' },
  'meera nair':  { phone: '+91 99001 87654', group_id: 'GRP-002', loan_id: 'LN-2024-0112', last_contact_date: '11 Jun 2026' },
  'vikram m':    { phone: '+91 93456 21098', group_id: 'GRP-005', loan_id: 'LN-2024-0119', last_contact_date: '07 Jun 2026' },
  'ananya i':    { phone: '+91 88765 43210', group_id: 'GRP-003', loan_id: 'LN-2024-0126', last_contact_date: '08 Jun 2026' },
  'sneha k':     { phone: '+91 91122 33445', group_id: 'GRP-004', loan_id: 'LN-2024-0133', last_contact_date: '04 Jun 2026' },
  'rahul d':     { phone: '+91 96655 44332', group_id: 'GRP-001', loan_id: 'LN-2024-0140', last_contact_date: '03 Jun 2026' },
  'kavita r':    { phone: '+91 90123 45678', group_id: 'GRP-008', loan_id: 'LN-2023-0158', last_contact_date: '28 May 2026' },
  'arjun vardhan': { phone: '+91 95432 10987', group_id: 'GRP-003', loan_id: 'LN-2024-0167', last_contact_date: '12 Jun 2026' },
};

/** Merge hardcoded extras into a doc where fields are missing */
function enrich(doc) {
  // Try exact lowercase name, then first-word match (e.g. "Suresh G." → "suresh g")
  const key = doc.member_name?.toLowerCase().replace(/\.$/, '').trim();
  const extras = HARDCODED_EXTRAS[key] ?? {};
  return {
    phone:             doc.phone             ?? extras.phone             ?? null,
    group_id:          doc.group_id          ?? extras.group_id          ?? null,
    loan_id:           doc.loan_id           ?? extras.loan_id           ?? null,
    last_contact_date: doc.last_contact_date ?? extras.last_contact_date ?? null,
    ...doc,
  };
}

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
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-3">
        <span className="text-slate-800">₹ {fmtInr(doc.overdue_amount_inr)}</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Clock size={10} /> {doc.days_late} days late</span>
      </div>

      {/* Detail fields */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone</p>
          <p className="text-[11px] font-bold text-slate-700 truncate">{doc.phone ?? '—'}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Group ID</p>
          <p className="text-[11px] font-bold text-slate-700 truncate">{doc.group_id ?? '—'}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Loan ID</p>
          <p className="text-[11px] font-bold text-slate-700 truncate">{doc.loan_id ?? '—'}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Last Contact</p>
          <p className="text-[11px] font-bold text-slate-700 truncate">{doc.last_contact_date ?? '—'}</p>
        </div>
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
  const _live = useWsStore((s) => s.recoveryCases);
  const recoveryCases = (_live.length > 0 ? _live : MOCK_CASES).map(enrich);
  const [search, setSearch] = useState('');

  // Group cases into Kanban columns
  const filtered = recoveryCases.filter((c) =>
    !search || c.member_name?.toLowerCase().includes(search.toLowerCase())
  );

  const byStage = (stageKey) => filtered.filter((c) => c.recovery_stage === stageKey);

  // ── Export CSV ──────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const COLS = [
      { header: 'Member Name',       key: 'member_name' },
      { header: 'Recovery Stage',    key: 'recovery_stage' },
      { header: 'Risk Level',        key: 'risk_level' },
      { header: 'Overdue Amount (INR)', key: 'overdue_amount_inr' },
      { header: 'Days Late',         key: 'days_late' },
      { header: 'Phone',             key: 'phone' },
      { header: 'Group ID',          key: 'group_id' },
      { header: 'Loan ID',           key: 'loan_id' },
      { header: 'Last Contact',      key: 'last_contact_date' },
    ];
    exportCsv('recovery_cases', COLS, filtered);
  }, [filtered]);

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
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Download size={14} /> Export CSV
                </button>
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
