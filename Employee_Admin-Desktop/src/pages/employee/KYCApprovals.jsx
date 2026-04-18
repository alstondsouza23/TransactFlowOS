import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Eye,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useAuthStore from '../../store/authStore';

// --- Sub-components ---

const MetricCard = ({ title, value, subtext, isPositive, trend }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-extrabold text-slate-800">{value}</span>
      {trend && (
        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </span>
      )}
      {subtext && !trend && (
        <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
          {subtext}
        </span>
      )}
    </div>
  </div>
);

const KYCStatusBadge = ({ status, reason }) => {
  const styles = {
    Approved: "bg-emerald-50 text-emerald-600",
    Pending: "bg-slate-100 text-slate-500",
    Rejected: "bg-rose-50 text-rose-600",
  };
  
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${styles[status]}`}>
        {status}
      </span>
      {reason && <span className="text-[10px] font-medium text-rose-400 italic font-inter">{reason}</span>}
    </div>
  );
};


export default function KYCApprovals() {
  const { user } = useAuthStore();
  const [selectAll, setSelectAll] = useState(false);

  const kycRequests = [
    { id: 1, name: "Arjun Vardhan", phone: "+91 98450 12345", pan: "ABCDE1234F", bank: "XXXX XXXX 8921", status: "Pending" },
    { id: 2, name: "Priya Sharma", phone: "+91 88220 55432", pan: "FGHIJ5678K", bank: "XXXX XXXX 4412", status: "Approved" },
    { id: 3, name: "Vikram Malhotra", phone: "+91 77600 88901", pan: "LMNOP9012Q", bank: "XXXX XXXX 1109", status: "Pending" },
    { id: 4, name: "Ananya Iyer", phone: "+91 99001 22334", pan: "RSTUV3456W", bank: "XXXX XXXX 7765", status: "Rejected", reason: "Blurred PAN card image" },
    { id: 5, name: "Rahul Deshmukh", phone: "+91 95550 67890", pan: "XYZAB7890C", bank: "XXXX XXXX 2234", status: "Pending" },
    { id: 6, name: "Sneha Kapur", phone: "+91 81234 56789", pan: "DEFGH1234L", bank: "XXXX XXXX 5567", status: "Pending" },
    { id: 7, name: "Amit Saxena", phone: "+91 70001 00021", pan: "IJKLM5678M", bank: "XXXX XXXX 9901", status: "Approved" },
    { id: 8, name: "Kavita Reddy", phone: "+91 99887 76655", pan: "NOPQR9012N", bank: "XXXX XXXX 3345", status: "Pending" },
  ];

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="KYC Approvals" />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">KYC Management</h1>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 shadow-sm focus:border-brand-blue/30 focus:ring-4 focus:ring-brand-blue/5 transition-all"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group border border-transparent hover:border-slate-100 shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse"></span>
              </button>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
            
            {/* Stats Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Pending KYC" value="14" trend="2 today" isPositive={true} />
              <MetricCard title="Approval Rate" value="92%" trend="4%" isPositive={true} />
              <MetricCard title="Average TAT" value="4.2h" trend="Standard" isPositive={true} />
              <MetricCard title="Flagged Profiles" value="3" subtext="Requires Admin" />
            </section>

            {/* Controls Bar */}
            <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                   <input 
                    type="text" 
                    placeholder="Search by name or PAN..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-blue/20 transition-all"
                  />
                </div>
                <select className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm text-slate-600 outline-none hover:bg-white transition-all cursor-pointer min-w-[160px]">
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                  <Download size={16} />
                  Export CSV
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1a2f55] text-white rounded-lg text-sm font-bold hover:bg-[#142445] transition-all shadow-lg shadow-brand-blue/20 cursor-pointer group">
                  <Play size={16} fill="white" className="group-hover:scale-110 transition-transform" />
                  Run Auto-Check
                </button>
              </div>
            </section>

            {/* Data Table */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="p-4 w-12 text-center">
                         <input 
                           type="checkbox" 
                           checked={selectAll} 
                           onChange={() => setSelectAll(!selectAll)} 
                           className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer" 
                         />
                       </th>
                       <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Applicant Details</th>
                       <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identifiers</th>
                       <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verification Docs</th>
                       <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Operations</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {kycRequests.map((req) => (
                       <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="p-4 text-center">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer" />
                         </td>
                         <td className="p-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-700">{req.name}</span>
                             <span className="text-[11px] font-medium text-slate-400">{req.phone}</span>
                           </div>
                         </td>
                         <td className="p-4">
                            <div className="grid grid-cols-[36px_1fr] gap-x-2 gap-y-1">
                               <span className="text-[9px] font-bold text-slate-400 uppercase self-center bg-slate-100 px-1 rounded inline-block w-fit">PAN</span>
                               <span className="text-[11px] font-bold text-slate-600 font-mono tracking-tight">{req.pan}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase self-center bg-slate-100 px-1 rounded inline-block w-fit">BANK</span>
                               <span className="text-[11px] font-bold text-slate-600 font-mono tracking-tight">{req.bank}</span>
                            </div>
                         </td>
                         <td className="p-4">
                            <div className="flex items-center gap-4">
                               <button className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer capitalize">
                                  <Eye size={14} /> Identity
                               </button>
                               <span className="text-slate-200">|</span>
                               <button className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer capitalize">
                                  <ExternalLink size={14} /> Passbook
                               </button>
                            </div>
                         </td>
                         <td className="p-4">
                            <KYCStatusBadge status={req.status} reason={req.reason} />
                         </td>
                         <td className="p-4 text-right">
                            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-lg hover:bg-white cursor-pointer group-hover:opacity-100 opacity-0">
                               <ArrowRight size={18} />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               {/* Pagination */}
               <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[13px] text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-700">1-8</span> of <span className="font-bold text-slate-700">42</span> requests
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-all" disabled>
                       <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-[13px] font-bold border border-blue-100">1</button>
                      <button className="w-8 h-8 rounded-lg text-slate-500 text-[13px] font-bold hover:bg-slate-50 border border-transparent">2</button>
                      <button className="w-8 h-8 rounded-lg text-slate-500 text-[13px] font-bold hover:bg-slate-50 border border-transparent">3</button>
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer transition-all">
                       <ChevronRight size={16} />
                    </button>
                  </div>
               </div>
            </section>

            <div className="flex items-center justify-center gap-3 py-4 opacity-70">
              <div className="bg-slate-100 p-1.5 rounded-full border border-slate-200 flex flex-shrink-0">
                 <ShieldCheck size={14} className="text-slate-400" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                All verification actions are cryptographically signed and recorded to the audit trail
              </p>
            </div>
          </main>
        </div>

        {/* System Status Footer Bar */}
        <KernelMonitor />
      </div>
    </div>
  );
}
