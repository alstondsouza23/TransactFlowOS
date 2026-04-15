import React from 'react';
import { 
  Bell, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  User,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/authStore';

// --- Sub-components (internal to keep this demo clean but robust) ---

const StatCard = ({ title, value, trend, isUp, sparklineColor, sparklinePath }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
      <div className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend}
      </div>
    </div>
    
    <div className="flex items-end justify-between">
      <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</span>
    </div>

    {/* Simple Sparkline SVG mimic */}
    <div className="h-12 w-full mt-2">
      <svg className="w-full h-full" preserveAspectRatio="none">
        <path 
          d={sparklinePath} 
          fill="none" 
          stroke={sparklineColor} 
          strokeWidth="2" 
          strokeLinecap="round"
          className="opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <defs>
          <linearGradient id={`grad-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: sparklineColor, stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: sparklineColor, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

const LoanApplicationItem = ({ name, tier, id, amount, status, isManual }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue border border-blue-100">
        <User size={20} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">{name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
            status === 'Eligible' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {status}
          </span>
          {isManual && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">
              Manual Review
            </span>
          )}
        </div>
        <div className="text-[11px] font-medium text-slate-400 mt-0.5">
          {id} • <span className="text-slate-500">Tier: {tier}</span>
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-8">
      <div className="text-right">
        <div className="text-sm font-bold text-slate-700">₹{amount}</div>
        <div className="text-[10px] font-medium text-slate-400">Principal Only</div>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-emerald-100 text-emerald-600 font-bold text-[11px] hover:bg-emerald-50 transition-colors cursor-pointer capitalize">
          <CheckCircle2 size={12} />
          Approve
        </button>
        <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-rose-100 text-rose-600 font-bold text-[11px] hover:bg-rose-50 transition-colors cursor-pointer capitalize">
          <XCircle size={12} />
          Reject
        </button>
      </div>
      {/* Visual spacer for when buttons are hidden */}
      <div className="w-0 group-hover:hidden transition-all overflow-hidden whitespace-nowrap text-slate-300">
         <XCircle size={12} className="opacity-0" />
      </div>
    </div>
  </div>
);

const ActivityItem = ({ user, action, target, time, icon: Icon, color }) => (
  <div className="flex gap-4 relative">
    <div className="z-10 bg-white p-1.5 rounded-full border border-slate-100 shadow-sm flex-shrink-0">
      <Icon size={14} className={color} />
    </div>
    <div className="flex flex-col gap-1 pb-6">
       <p className="text-[13px] leading-tight text-slate-600 font-medium">
         <span className="font-bold text-slate-800 underline decoration-slate-200 cursor-pointer">{user}</span> {action} <span className="font-bold text-slate-800">{target}</span>
       </p>
       <span className="text-[11px] text-slate-400 flex items-center gap-1">
         <Clock size={10} /> {time}
       </span>
    </div>
    {/* Connection Line */}
    <div className="absolute left-[11px] top-8 bottom-0 w-[1px] bg-slate-100 -z-0"></div>
  </div>
);

export default function EmployeeDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Operations Center</h1>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all cursor-pointer relative group">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 pb-16 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Stats Bar */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Pending KYC" 
              value="24" 
              trend="12%" 
              isUp={true} 
              sparklineColor="#10b981" 
              sparklinePath="M0 40 Q 20 20 40 35 T 80 15 T 120 25 T 160 10 T 200 30"
            />
            <StatCard 
              title="Loans to Review" 
              value="18" 
              trend="5%" 
              isUp={false} 
              sparklineColor="#3b82f6" 
              sparklinePath="M0 10 Q 30 25 60 15 T 120 40 T 180 30 T 400 35"
            />
            <StatCard 
              title="Active Defaults" 
              value="3" 
              trend="0%" 
              isUp={true} 
              sparklineColor="#ef4444" 
              sparklinePath="M0 35 L 50 35 L 100 32 L 150 40 L 200 35"
            />
            <StatCard 
              title="Resolved (MTD)" 
              value="142" 
              trend="28%" 
              isUp={true} 
              sparklineColor="#6366f1" 
              sparklinePath="M0 45 L 40 40 L 80 30 L 120 35 L 160 15 L 200 10"
            />
          </section>

          <section className="grid grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Loan Applications */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">Loan Applications Inbox</h2>
                  <span className="bg-blue-100 text-blue-600 font-bold text-xs px-2 py-0.5 rounded-md">6</span>
                </div>
                <button className="text-sm font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer group">
                  View All Queues <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="space-y-3">
                <LoanApplicationItem name="Arjun Sharma" tier="Gold" id="LN-8802" amount="50,000" status="Eligible" />
                <LoanApplicationItem name="Priya Venkatesh" tier="Platinum" id="LN-8805" amount="1,20,000" status="Eligible" />
                <LoanApplicationItem name="Rohan Dasgupta" tier="Silver" id="LN-8812" amount="25,000" status="Review" isManual={true} />
                <LoanApplicationItem name="Meera Nair" tier="Gold" id="LN-8819" amount="75,000" status="Eligible" />
                <LoanApplicationItem name="Suresh Prabhu" tier="Premium" id="LN-8824" amount="2,00,000" status="Review" isManual={true} />
                <LoanApplicationItem name="Anjali Gupta" tier="Silver" id="LN-8830" amount="40,000" status="Eligible" />
              </div>

              <button className="w-full py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer border-dashed border-2">
                Load More Applications
              </button>
            </div>

            {/* Right Column: Feed and Tools */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              
              {/* Activity Feed */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-50 overflow-hidden flex flex-col h-[520px]">
                <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800">Live Activity Feed</h3>
                </div>
                <div className="flex-1 p-6 overflow-y-auto no-scrollbar scroll-smooth">
                  <ActivityItem 
                    user="Sarah Smith" 
                    action="approved KYC for" 
                    target="Vikram Malhotra" 
                    time="12m ago" 
                    icon={UserCheck} 
                    color="text-emerald-500" 
                  />
                  <ActivityItem 
                    user="David Chen" 
                    action="flagged loan LN-8792 for" 
                    target="manual audit" 
                    time="45m ago" 
                    icon={AlertCircle} 
                    color="text-amber-500" 
                  />
                  <ActivityItem 
                    user="System OS" 
                    action="auto-resolved 12" 
                    target="pending cycles" 
                    time="1h ago" 
                    icon={CheckCircle2} 
                    color="text-blue-500" 
                  />
                  <ActivityItem 
                    user="Sarah Smith" 
                    action="rejected default appeal for" 
                    target="Member #021" 
                    time="2h ago" 
                    icon={XCircle} 
                    color="text-rose-500" 
                  />
                  <ActivityItem 
                    user="Anita Ray" 
                    action="updated Recovery Stage to 'Legal' for" 
                    target="LN-764" 
                    time="4h ago" 
                    icon={FileText} 
                    color="text-slate-600" 
                  />
                  <ActivityItem 
                    user="System OS" 
                    action="performed" 
                    target="Kernel routine maintenance" 
                    time="6h ago" 
                    icon={AlertCircle} 
                    color="text-slate-400" 
                  />
                </div>
                <button className="p-4 text-xs font-bold text-slate-500 bg-slate-50 border-t border-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                   See Full Audit Log
                </button>
              </div>

              {/* Quick Tools */}
              <div className="space-y-4">
                 <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quick Tools</h3>
                 
                 <button className="w-full bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all">
                    <span className="text-sm font-bold text-slate-700">Batch Approve KYC</span>
                    <span className="bg-brand-blue text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full">8</span>
                 </button>

                 <button className="w-full bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all">
                    <span className="text-sm font-bold text-slate-700">Generate Cycle Report</span>
                    <ArrowUpRight size={16} className="text-slate-400 group-hover:text-brand-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                 </button>
              </div>

            </div>

          </section>

        </main>
      </div>
    </div>
  );
}
