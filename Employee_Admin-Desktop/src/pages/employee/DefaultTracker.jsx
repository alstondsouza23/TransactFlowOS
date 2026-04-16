import React from 'react';
import { 
  Bell, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  MoreVertical,
  Clock,
  User,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  LineChart
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/authStore';

// --- Sub-components ---

const MetricInsight = ({ icon: Icon, title, value, subtext, color, bg }) => (
  <div className={`p-6 rounded-2xl border ${bg} ${color} flex flex-col gap-3 shadow-sm`}>
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-white/50 rounded-lg">
          <Icon size={18} />
        </div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest opacity-70">{title}</h4>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-extrabold tracking-tight">{value}</span>
      <span className="text-[11px] font-bold mt-1 opacity-70 italic">{subtext}</span>
    </div>
  </div>
);

const KanbanCard = ({ member, amount, days, lastAction }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col gap-3 cursor-pointer">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
          <User size={14} className="text-slate-400" />
        </div>
        <span className="text-sm font-bold text-slate-700">{member}</span>
      </div>
      <button className="text-slate-300 hover:text-slate-600">
        <MoreVertical size={14} />
      </button>
    </div>
    
    <div className="flex justify-between items-end">
      <div className="flex flex-col">
        <span className="text-[13px] font-extrabold text-slate-800">₹{amount}</span>
        <span className="text-[10px] text-slate-400 font-medium">Last: {lastAction}</span>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 uppercase">
        {days}D Overdue
      </span>
    </div>
  </div>
);

const KanbanColumn = ({ title, count, color, isCritical, children }) => (
  <div className="flex flex-col gap-4 min-w-[280px] w-full max-w-[320px]">
    <div className={`flex items-center justify-between p-3 rounded-xl border-b-2 ${isCritical ? 'bg-rose-50/30 border-rose-500' : 'bg-slate-50/50 border-slate-200'}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</h3>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isCritical ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {count}
        </span>
      </div>
      <button className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-700 transition-all cursor-pointer">
        <Plus size={14} />
      </button>
    </div>
    <div className="flex flex-col gap-3 max-h-[calc(100vh-600px)] overflow-y-auto pr-1 no-scrollbar">
      {children || <div className="h-32 rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-[10px] font-black uppercase">No active cases</div>}
    </div>
  </div>
);

const SystemMetric = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 group cursor-default">
    <Icon size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}:</span>
    <span className="text-[10px] font-mono font-bold text-slate-200">{value}</span>
  </div>
);

export default function DefaultTracker() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage="Recovery" />
        
        <div className="flex-1 flex flex-col overflow-y-auto relative">
          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Default Recovery Tracker</h1>
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
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f6f8fb] group-hover:border-white"></span>
              </button>
            </div>
          </header>

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-20">
            
            {/* Upper Performance Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Performance Chart Card */}
              <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-brand-blue rounded-xl">
                      <LineChart size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Recovery Performance Trend</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic lowercase">Aggregated movement of default cases over 6 months</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-white transition-all cursor-pointer">
                      <Filter size={12} /> Filter Groups
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-white transition-all cursor-pointer">
                      <Calendar size={12} /> Last 180 Days
                    </button>
                  </div>
                </div>

                {/* SVG Performance Chart */}
                <div className="flex-1 min-h-[220px] w-full relative">
                  <svg className="w-full h-full" overflow="visible" preserveAspectRatio="none">
                    {/* Grids */}
                    {[20, 40, 60, 80].map(y => (
                      <line key={y} x1="0%" y1={`${100 - y}%`} x2="100%" y2={`${100 - y}%`} stroke="#f1f5f9" strokeWidth="1" />
                    ))}
                    
                    {/* Data Line: New Defaults (Red) */}
                    <path 
                      d="M 0 55 Q 100 35, 200 45 T 400 40 T 600 30 T 800 50" 
                      fill="rgba(244, 63, 94, 0.05)" 
                      stroke="none"
                      className="transition-all duration-700"
                    />
                    <path 
                      d="M 0 55 Q 100 35, 200 45 T 400 40 T 600 30 T 800 50" 
                      fill="none" 
                      stroke="#f43f5e" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />

                    {/* Data Line: Recovered Funds (Black) */}
                    <path 
                      d="M 0 70 Q 150 65, 300 68 T 500 62 T 700 45 T 800 35" 
                      fill="rgba(26, 47, 85, 0.03)" 
                      stroke="none"
                    />
                    <path 
                      d="M 0 70 Q 150 65, 300 68 T 500 62 T 700 45 T 800 35" 
                      fill="none" 
                      stroke="#1a2f55" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />

                    {/* Months Label UI Placeholder */}
                    <foreignObject x="0" y="90%" width="100%" height="20">
                       <div className="flex justify-between items-center px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                         <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                       </div>
                    </foreignObject>
                  </svg>
                </div>

                <div className="flex items-center justify-center gap-6 mt-2">
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-[#1a2f55]"></div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Recovered Funds</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase">New Defaults</span>
                   </div>
                </div>
              </div>

              {/* Sidebar Metrics Column */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                 <MetricInsight 
                    title="Critical Defaults" 
                    value="14" 
                    subtext="+2 from last week" 
                    icon={AlertTriangle} 
                    bg="bg-rose-50 border-rose-100" 
                    color="text-rose-600" 
                 />
                 <MetricInsight 
                    title="Resolved Cases" 
                    value="₹1.4M" 
                    subtext="Target: 85%" 
                    icon={CheckCircle} 
                    bg="bg-white border-slate-100" 
                    color="text-slate-800" 
                 />
              </div>

            </section>

            {/* Kanban Recovery Board section */}
            <section className="space-y-6 overflow-hidden">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recovery Lifecycle</h2>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">Live Tracker</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline">Archive</button>
                  </div>
               </div>

               <div className="flex gap-6 overflow-x-auto pb-8 scroll-smooth no-scrollbar">
                  
                  <KanbanColumn title="Payment Missed" count="2" isCritical={true}>
                     <KanbanCard member="Rakesh Singh (#881)" amount="12,500" days="3" lastAction="System Call" />
                     <KanbanCard member="Sunita K. (#442)" amount="8,200" days="5" lastAction="Email Auto" />
                  </KanbanColumn>

                  <KanbanColumn title="Contacted" count="1">
                     <KanbanCard member="Vikram Sethi (#102)" amount="45,000" days="12" lastAction="Tele-Call Done" />
                  </KanbanColumn>

                  <KanbanColumn title="Notice Sent" count="1">
                     <KanbanCard member="Aarav Sharma (#77)" amount="1,12,000" days="28" lastAction="Legal Notice 1" />
                  </KanbanColumn>

                  <KanbanColumn title="Follow-up" count="0">
                  </KanbanColumn>

                  <KanbanColumn title="In-Legal" count="0">
                  </KanbanColumn>

               </div>
            </section>

          </main>
        </div>
      </div>

      {/* System Status Footer Bar (OS Style) */}
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
             CHITOS_KERNEL_v1.0.4 // THREADS: 128 [STABLE]
           </span>
        </div>
      </footer>
    </div>
  );
}
