import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowRight,
  Plus,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import KernelMonitor from '../../components/KernelMonitor';
import useAuthStore from '../../store/authStore';

// --- Sub-components ---

const LoanApplicationCard = ({ name, amount, date, status, score }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const statusStyles = {
    Pending: "bg-slate-100 text-slate-500",
    Verified: "bg-emerald-50 text-emerald-600",
    Reviewing: "bg-brand-blue/10 text-brand-blue",
  };

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isExpanded ? 'ring-2 ring-brand-blue/20 bg-blue-50/10' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-brand-blue transition-colors">
            <User size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm">{name}</h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</span>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusStyles[status]}`}>
          {status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Requested Amount</span>
          <span className="text-lg font-black text-[#1a2f55]">₹ {amount}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Risk Score</span>
          <span className={`text-sm font-black ${score > 800 ? 'text-emerald-500' : 'text-blue-500'}`}>{score}</span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employment</span>
                <p className="text-xs font-bold text-slate-600">Senior Developer @ Tech Solution</p>
             </div>
             <div className="space-y-1 text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Income</span>
                <p className="text-xs font-bold text-slate-600">₹ 85,000</p>
             </div>
           </div>
           
           <div className="bg-slate-50 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-slate-500">KYC Status</span>
                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded">PASSED</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-slate-500">Bureau Score</span>
                 <span className="text-[10px] font-black text-slate-700">742 / 900</span>
              </div>
           </div>

           <div className="flex items-center gap-2 pt-2">
              <button className="flex-1 py-2 bg-[#1a2f55] text-white text-[11px] font-black rounded-lg hover:bg-[#142445] transition-all">
                 Fast-Track Approve
              </button>
              <button className="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-all">
                 <ExternalLink size={14} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, trend, isUp, icon: Icon }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 min-w-[240px] group hover:border-brand-blue/30 transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
        <Icon size={20} className="text-slate-500 group-hover:text-brand-blue" />
      </div>
      <div className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isUp ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
        {trend}
      </div>
    </div>
    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">{title}</span>
    <span className="text-3xl font-black text-[#1a2f55]">{value}</span>
  </div>
);

export default function EmployeeDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar activePage="Ops Dashboard" />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full shrink-0">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Ops Center Overview</h1>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue" size={16} />
                <input 
                  type="text" 
                  placeholder="Search applications..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 shadow-sm focus:border-brand-blue/20 transition-all"
                />
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group border border-slate-100/50 shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse"></span>
              </button>
            </div>
          </header>

          <main className="p-8 space-y-10 max-w-[1400px] mx-auto w-full pb-12">
            
            {/* Top Stat Row */}
            <div className="flex flex-wrap gap-6">
              <StatCard title="Active Applications" value="28" trend="+4.5%" isUp={true} icon={ShieldCheck} />
              <StatCard title="Total Disbursed" value="₹ 18.5 L" trend="+12%" isUp={true} icon={TrendingUp} />
              <StatCard title="Default Warning" value="4.2%" trend="-0.8%" isUp={false} icon={TrendingDown} />
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
               {/* Left Column: Loan Applications */}
               <div className="col-span-12 lg:col-span-8 space-y-6">
                  <div className="flex items-end justify-between px-1">
                    <div>
                        <h3 className="text-lg font-black text-[#1a2f55] tracking-tight">Loan Application Inbox</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">Reviewing incoming debt requests for approval</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                       <Filter size={14} /> Filter
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <LoanApplicationCard name="Rahul Sharma" amount="50,000" date="2 hours ago" status="Reviewing" score={842} />
                     <LoanApplicationCard name="Priyanka Chopra" amount="1,50,000" date="5 hours ago" status="Verified" score={910} />
                     <LoanApplicationCard name="Amit Kumar" amount="25,000" date="Yesterday" status="Pending" score={720} />
                     <LoanApplicationCard name="Sneha Reddy" amount="80,000" date="Yesterday" status="Reviewing" score={785} />
                     <LoanApplicationCard name="Vikram Singh" amount="2,00,000" date="2 days ago" status="Pending" score={650} />
                     <LoanApplicationCard name="Ananya Desai" amount="1,20,000" date="2 days ago" status="Verified" score={880} />
                  </div>
               </div>

               {/* Right Column: Activity Feed */}
               <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-700 tracking-tight">Live Activity</h3>
                    <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-lg uppercase tracking-widest">Real-time</span>
                  </div>

                  <div className="space-y-6">
                     <ActivityItem time="14:22" user="System" action="Auction #GRP-22 Ended" amount="₹ 45,000 Won" />
                     <ActivityItem time="13:58" user="Anil K." action="KYC Submission" amount="Manual Review" />
                     <ActivityItem time="13:10" user="System" action="Default Warning" amount="Member #042" />
                     <ActivityItem time="12:45" user="Sunita M." action="Loan Request" amount="₹ 50,000" />
                     <ActivityItem time="12:20" user="System" action="WAL Checkpoint" amount="Integrity OK" />
                  </div>

                  <button className="w-full py-3 bg-slate-50 text-slate-400 text-xs font-black rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest">
                     View All Logs
                  </button>
               </div>
            </div>
          </main>
        </div>

        {/* System Status Footer Bar */}
        <KernelMonitor />
      </div>
    </div>
  );
}

function ActivityItem({ time, user, action, amount }) {
  return (
    <div className="flex gap-4 group">
       <div className="flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-slate-200 mt-2 group-hover:bg-brand-blue transition-colors"></div>
          <div className="flex-1 w-[1px] bg-slate-100 my-1"></div>
       </div>
       <div className="flex-1 pb-6">
          <div className="flex justify-between items-start">
             <span className="text-[11px] font-bold text-slate-400">{time}</span>
             <span className="text-[11px] font-black text-slate-700">{amount}</span>
          </div>
          <p className="text-[13px] font-bold text-slate-600 mt-1">{action}</p>
          <span className="text-[10px] text-slate-400 font-medium">Actor: {user}</span>
       </div>
    </div>
  );
}
