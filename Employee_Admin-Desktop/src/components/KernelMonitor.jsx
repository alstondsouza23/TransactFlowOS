/**
 * src/components/KernelMonitor.jsx
 *
 * Persistent footer bar showing live kernel / system metrics.
 * Data comes from wsStore.kernelState (pushed by the WS backend
 * every time kernel_state/live changes in Firestore).
 *
 * Connection indicator:
 *   🟢 — connected
 *   🟡 — connecting / no data yet
 *   🔴 — disconnected
 */

import React from 'react';
import { Cpu, Database, Lock, Wifi, WifiOff } from 'lucide-react';
import useWsStore from '../store/wsStore';

const SystemMetric = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 group cursor-default">
    <Icon size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}:</span>
    <span className="text-[10px] font-mono font-bold text-slate-200">{value}</span>
  </div>
);

/** Format bytes as "1.2GB / 16.0GB" */
function fmtRam(used, total) {
  if (used == null) return '—';
  const u = Number(used).toFixed(1);
  const t = total != null ? ` / ${Number(total).toFixed(1)}GB` : '';
  return `${u}GB${t}`;
}

/** Format integer with commas (Indian locale safe) */
function fmtCount(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

export default function KernelMonitor() {
  const kernelState = useWsStore((s) => s.kernelState);
  const connected   = useWsStore((s) => s.connected);

  const ram       = fmtRam(kernelState?.ram_used_gb, kernelState?.ram_total_gb);
  const walCount  = fmtCount(kernelState?.wal_entry_count);
  const lockStatus = kernelState?.auction_lock_status ?? '—';
  const lockId     = kernelState?.auction_lock_id ? ` (${kernelState.auction_lock_id})` : '';
  const threads    = kernelState?.thread_count ?? '—';
  const version    = kernelState?.kernel_version ?? 'TRANSACTFLOW_KERNEL_v1.0.4';

  return (
    <footer className="h-10 bg-[#1a1a1a] border-t border-slate-800 flex items-center justify-between px-6 shrink-0 z-30">
      <div className="flex items-center gap-8">
        <SystemMetric icon={Cpu}      label="RAM"          value={ram} />
        <div className="w-[1px] h-3 bg-slate-800" />
        <SystemMetric icon={Database} label="WAL Entries"  value={walCount} />
        <div className="w-[1px] h-3 bg-slate-800" />
        <SystemMetric icon={Lock}     label="Auction Lock" value={`${lockStatus}${lockId}`} />
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status indicator */}
        <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${
          connected ? 'text-emerald-500' : 'text-rose-500'
        }`}>
          {connected
            ? <Wifi size={11} className="text-emerald-500" />
            : <WifiOff size={11} className="text-rose-500" />
          }
          {connected ? 'Live' : 'Offline'}
        </div>

        <div className="w-[1px] h-3 bg-slate-800" />

        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">
          {version} // THREADS: {threads} [STABLE]
        </span>
      </div>
    </footer>
  );
}
