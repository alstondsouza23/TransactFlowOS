import React from 'react';
import { Cpu, Database, Lock } from 'lucide-react';

const SystemMetric = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 group cursor-default">
    <Icon size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}:</span>
    <span className="text-[10px] font-mono font-bold text-slate-200">{value}</span>
  </div>
);

export default function KernelMonitor() {
  return (
    <footer className="h-10 bg-[#1a1a1a] border-t border-slate-800 flex items-center justify-between px-6 shrink-0 z-30">
      <div className="flex items-center gap-8">
         <SystemMetric icon={Cpu} label="RAM" value="1.2GB / 16GB" />
         <div className="w-[1px] h-3 bg-slate-800"></div>
         <SystemMetric icon={Database} label="WAL Entries" value="42,901" />
         <div className="w-[1px] h-3 bg-slate-800"></div>
         <SystemMetric icon={Lock} label="Auction Lock" value="ACTIVE (0x7F2A)" />
      </div>
      <div className="flex items-center gap-4">
         <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">
           TRANSACTFLOW_KERNEL_v1.0.4 // THREADS: 128 [STABLE]
         </span>
      </div>
    </footer>
  );
}
