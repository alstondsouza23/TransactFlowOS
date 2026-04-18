import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Plus,
  Filter,
  MoreVertical,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Activity,
  Phone,
  MessageSquare
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useAuthStore from '../../store/authStore';

const RecoveryCard = ({ name, amount, delay, days, risk }) => {
  const riskColors = {
    High: "text-rose-500 bg-rose-50 border-rose-100",
    Medium: "text-amber-500 bg-amber-50 border-amber-100",
    Low: "text-emerald-500 bg-emerald-50 border-emerald-100"
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${riskColors[risk]}`}>
          {risk} Risk
        </span>
        <button className="text-slate-300 hover:text-slate-600">
           <MoreVertical size={14} />
        </button>
      </div>
      
      <h4 className="text-sm font-bold text-slate-700 mb-1">{name}</h4>
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-4">
         <span className="text-slate-800">₹ {amount}</span>
         <span>•</span>
         <span className="flex items-center gap-1"><Clock size={10} /> {days} days late</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
         <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
               <User size={12} />
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all">
               <Phone size={14} />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all">
               <MessageSquare size={14} />
            </button>
         </div>
      </div>
    </div>
  );
};

const BoardColumn = ({ title, count, children, color }) => (
  <div className="flex-1 min-w-[300px] flex flex-col h-full">
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
         <div className={`w-2 h-2 rounded-full ${color}`}></div>
         <h3 className="text-sm font-black text-slate-700 tracking-tight uppercase">{title}</h3>
         <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <button className="text-slate-400 hover:text-slate-600">
         <Plus size={16} />
      </button>
    </div>
    
    <div className="flex-1 bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50 space-y-3 overflow-y-auto no-scrollbar">
       {children}
    </div>
  </div>
);

export default function DefaultTracker() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="Recovery" />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full shrink-0">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Recovery Tracker</h1>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 shadow-sm focus:border-brand-blue/20 transition-all"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group border border-slate-100/50 shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse"></span>
              </button>
            </div>
          </header>

          <main className="p-8 space-y-6 h-[calc(100vh-64px-40px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
               <div>
                  <h2 className="text-2xl font-black text-[#1a2f55] tracking-tight">Recovery Pipeline</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">Managing default interventions and debt collection stages</p>
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
               <BoardColumn title="Overdue (1-5)" count={3} color="bg-blue-400">
                  <RecoveryCard name="Arjun Vardhan" amount="12,500" days={3} risk="Low" />
                  <RecoveryCard name="Suresh G." amount="4,200" days={5} risk="Low" />
                  <RecoveryCard name="Meera Nair" amount="8,900" days={2} risk="Low" />
               </BoardColumn>

               <BoardColumn title="Warning (5-15)" count={2} color="bg-amber-400">
                  <RecoveryCard name="Vikram M." amount="25,000" days={12} risk="Medium" />
                  <RecoveryCard name="Ananya I." amount="15,400" days={8} risk="Medium" />
               </BoardColumn>

               <BoardColumn title="Critical (15-30)" count={2} color="bg-rose-500">
                  <RecoveryCard name="Rahul D." amount="42,000" days={22} risk="High" />
                  <RecoveryCard name="Sneha K." amount="31,000" days={28} risk="High" />
               </BoardColumn>

               <BoardColumn title="Legal / NPR" count={1} color="bg-slate-800">
                  <RecoveryCard name="Kavita R." amount="1,05,000" days={45} risk="High" />
               </BoardColumn>
            </div>
          </main>
        </div>

        {/* System Status Footer Bar */}
        <KernelMonitor />
      </div>
    </div>
  );
}
