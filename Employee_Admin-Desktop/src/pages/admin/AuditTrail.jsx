import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Calendar, 
  Filter, 
  X, 
  Download, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  User,
  Settings,
  Cpu,
  Database,
  Lock,
  Activity,
  History,
  Bell,
  Fingerprint,
  FileSearch,
  Zap,
  Box
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useAuthStore from '../../store/authStore';

// --- Sub-components ---

const ActionBadge = ({ code }) => {
  const styles = {
    TX_AUTH_APPROVE: "bg-blue-50 text-blue-600 border-blue-100",
    AUC_ROOM_LOCK: "bg-emerald-50 text-emerald-600 border-emerald-100",
    KYC_DOC_REJECT: "bg-orange-50 text-orange-600 border-orange-100",
    SYS_CFG_UPDATE: "bg-purple-50 text-purple-600 border-purple-100",
    WAL_INTEGRITY_CHECK: "bg-slate-50 text-slate-500 border-slate-200",
  };
  
  return (
    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest font-mono ${styles[code] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
      {code}
    </span>
  );
};

const ActorCell = ({ name, role }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
      role === 'system' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 
      role === 'admin' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
      'bg-slate-50 border-slate-100 text-slate-600'
    }`}>
      {role === 'system' ? <Cpu size={16} /> : <User size={16} />}
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-bold text-slate-700">{name}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role}</span>
    </div>
  </div>
);

const HealthKPI = ({ label, value, subtext, colorClass, highlight }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex-1 min-w-[200px] group hover:shadow-md transition-shadow">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</h4>
    <div className="flex flex-col gap-1">
      <span className={`text-2xl font-black ${colorClass || 'text-slate-800'}`}>{value}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-400">{subtext}</span>
        {highlight && (
          <span className="text-[10px] font-black text-emerald-500">{highlight}</span>
        )}
      </div>
    </div>
  </div>
);


export default function AuditTrail() {
  const { user } = useAuthStore();

  const auditLogs = [
    { index: 42901, timestamp: "2024-05-20 14:32:01", actor: "Admin System", role: "admin", code: "TX_AUTH_APPROVE", type: "LOAN_APP", id: "LN-992831", details: "Authorized loan disbursement for Member ID M-5102." },
    { index: 42900, timestamp: "2024-05-20 14:30:15", actor: "System Kernel", role: "system", code: "AUC_ROOM_LOCK", type: "AUCTION", id: "GRP-B12", details: "Auction session locked successfully after timeout." },
    { index: 42899, timestamp: "2024-05-20 14:28:44", actor: "John Employee", role: "employee", code: "KYC_DOC_REJECT", type: "MEMBER", id: "M-5102", details: "Rejected PAN document: Image blurry or unreadable." },
    { index: 42898, timestamp: "2024-05-20 14:25:00", actor: "Admin System", role: "admin", code: "SYS_CFG_UPDATE", type: "SETTINGS", id: "INT_RATE_BASE", details: "Updated base interest rate from 12.5% to 12.0%." },
    { index: 42897, timestamp: "2024-05-20 14:15:22", actor: "System Kernel", role: "system", code: "WAL_INTEGRITY_CHECK", type: "SYSTEM", id: "ROOT_CHAIN", details: "Automated 1-hour block consistency verification passed." },
  ];

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="Audit Trail" />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full shrink-0">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">System Audit Trail</h1>
            
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 shadow-sm"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group border border-slate-100/50 shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse"></span>
              </button>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-12">
            
            {/* Title & Primary Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-[#1a2f55] tracking-tight">Audit Forensics</h2>
                <p className="text-sm font-bold text-slate-400">Comprehensive system Write-Ahead Log (WAL) for compliance and integrity.</p>
              </div>
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                    <Download size={18} />
                    Export CSV
                 </button>
                 <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1a2f55] text-white rounded-xl text-sm font-black hover:bg-[#142445] transition-all shadow-lg shadow-brand-blue/20 group">
                    <Fingerprint size={18} className="group-hover:scale-110 transition-transform" />
                    Verify WAL Integrity
                 </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
               <div className="relative flex-1 min-w-[320px] group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by Actor, Entity ID, or Details..." 
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-brand-blue/5 transition-all"
                  />
               </div>
               
               <div className="flex items-center gap-3 flex-wrap">
                  <button className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all">
                    <Calendar size={16} className="text-slate-400" />
                    Date Range
                    <ChevronRight size={14} className="text-slate-300 rotate-90" />
                  </button>

                  <button className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all">
                    <Filter size={16} className="text-slate-400" />
                    Action Type: <span className="text-brand-blue">All</span>
                    <ChevronRight size={14} className="text-slate-300 rotate-90" />
                  </button>

                  <button className="px-4 py-3 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                    Clear Filters
                  </button>
               </div>
            </div>

            {/* Forensic Data Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="py-5 pl-8 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"># INDEX</th>
                        <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ISO TIMESTAMP</th>
                        <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ACTOR & ROLE</th>
                        <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">ACTION CODE</th>
                        <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ENTITY TYPE</th>
                        <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ENTITY ID</th>
                        <th className="py-5 pl-4 pr-8 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ACTIVITY DETAILS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {auditLogs.map((log) => (
                         <tr key={log.index} className="hover:bg-slate-50/30 transition-colors group">
                           <td className="py-6 pl-8 pr-4">
                              <span className="text-sm font-black text-slate-300 group-hover:text-slate-500 transition-colors">{log.index}</span>
                           </td>
                           <td className="py-6 px-4">
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-700">{log.timestamp.split(' ')[0]}</span>
                                 <span className="text-[11px] font-black text-slate-400 font-mono tracking-tighter">{log.timestamp.split(' ')[1]}</span>
                              </div>
                           </td>
                           <td className="py-6 px-4">
                              <ActorCell name={log.actor} role={log.role} />
                           </td>
                           <td className="py-6 px-4 text-center">
                              <ActionBadge code={log.code} />
                           </td>
                           <td className="py-6 px-4">
                              <span className="text-[11px] font-black text-slate-500 border border-slate-200 px-2 py-1 rounded bg-slate-50/50 uppercase tracking-widest">
                                {log.type}
                              </span>
                           </td>
                           <td className="py-6 px-4">
                              <span className="text-sm font-black text-brand-blue underline decoration-blue-100 hover:decoration-brand-blue cursor-pointer transition-all">
                                {log.id}
                              </span>
                           </td>
                           <td className="py-6 pl-4 pr-8">
                              <p className="text-[13px] font-medium text-slate-600 line-clamp-2 leading-relaxed">
                                {log.details}
                              </p>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>

               {/* Pagination */}
               <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[13px] font-bold text-slate-400">
                    Showing <span className="text-slate-800">1-5</span> of <span className="text-slate-800">42,901</span> log entries
                  </p>
                  <div className="flex items-center gap-2">
                     <button className="p-2 border border-slate-100 rounded-lg text-slate-300 hover:bg-slate-50 cursor-pointer">
                        <ChevronLeft size={16} />
                     </button>
                     <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue text-xs font-black border border-blue-100 shadow-sm">1</button>
                        <button className="w-8 h-8 rounded-lg text-slate-400 text-xs font-black hover:bg-slate-50 transition-colors">2</button>
                        <button className="w-8 h-8 rounded-lg text-slate-400 text-xs font-black hover:bg-slate-50 transition-colors">3</button>
                        <span className="text-slate-300 px-1">...</span>
                        <button className="w-12 h-8 rounded-lg text-slate-400 text-xs font-black hover:bg-slate-50 transition-colors text-center">8581</button>
                     </div>
                     <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer transition-all">
                        <ChevronRight size={16} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Forensic Health Indicators */}
            <div className="flex flex-wrap gap-6">
                <HealthKPI 
                  label="Health Status" 
                  value="NOMINAL" 
                  subtext="No latency detected in WAL writes." 
                  colorClass="text-emerald-500" 
                />
                <HealthKPI 
                  label="Daily Volume" 
                  value="1,284" 
                  subtext="Total writes in the last 24h." 
                  highlight="+12%" 
                />
                <HealthKPI 
                  label="Security Events" 
                  value="0" 
                  subtext="Potential breaches or unauthorized attempts." 
                  colorClass="text-emerald-500" 
                />
                <HealthKPI 
                  label="Chain Size" 
                  value="4.2 GB" 
                  subtext="Forensic data footprint on OS kernel." 
                />
            </div>

          </main>
        </div>

        {/* System Status Footer Bar */}
        <KernelMonitor />
      </div>
    </div>
  );
}
