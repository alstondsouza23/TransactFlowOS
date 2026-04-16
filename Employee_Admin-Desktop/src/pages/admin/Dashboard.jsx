import React from 'react';
import { 
  Bell, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Layers,
  Users,
  CircleDollarSign,
  AlertOctagon,
  ArrowUpRight,
  Activity,
  User
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/authStore';

// --- Sub-components (internal) ---

const AdminStatCard = ({ title, value, trend, isUp, icon: Icon }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50 flex flex-col gap-3 group hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
        <Icon size={18} className="text-slate-500 group-hover:text-brand-blue" />
      </div>
      <div className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isUp ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
        {trend}
      </div>
    </div>
    <div>
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
      <span className="text-2xl font-extrabold text-[#1a2f55] tracking-tight">{value}</span>
      <p className="text-[10px] text-slate-400 font-medium mt-0.5">vs last month</p>
    </div>
  </div>
);

const GroupRow = ({ name, members, amount, progress, status, defaultRate }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const statusStyles = {
    Active: "bg-slate-100 text-slate-600",
    Initiating: "bg-blue-50 text-blue-600",
    Delayed: "bg-rose-50 text-rose-600",
    Completed: "bg-emerald-50 text-emerald-600",
  };

  return (
    <>
      <tr 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`border-b border-slate-50 transition-all duration-200 cursor-pointer group ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
      >
        <td className="py-4 pl-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700 underline decoration-transparent group-hover:decoration-slate-200 transition-all">{name}</span>
            <span className="text-[10px] font-medium text-slate-400">G-902</span>
          </div>
        </td>
        <td className="py-4 text-sm font-bold text-slate-600 px-4">{members}</td>
        <td className="py-4 text-sm font-bold text-slate-700 px-4">₹ {amount}</td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
               <div className="h-full bg-brand-blue transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-[11px] font-bold text-slate-500">{progress}%</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${statusStyles[status]}`}>
            {status}
          </span>
        </td>
        <td className={`py-4 px-4 text-sm font-bold ${parseFloat(defaultRate) > 2 ? 'text-rose-500' : 'text-slate-600'}`}>
          {defaultRate}%
        </td>
        <td className="py-4 pr-4 text-right">
          <div className={`transition-transform duration-300 inline-block text-slate-300 group-hover:text-slate-500 ${isExpanded ? 'rotate-90 text-brand-blue' : ''}`}>
             <ChevronRight size={18} />
          </div>
        </td>
      </tr>
      
      {/* Expanded Metrics Row */}
      {isExpanded && (
        <tr className="bg-slate-50/50 border-b border-slate-100/50">
          <td colSpan="7" className="p-0">
            <div className="px-6 py-5 grid grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1.5 border-l-2 border-blue-200 pl-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Auction</span>
                 <p className="text-xs font-bold text-slate-700">22 May 2026 • 11:00 AM</p>
                 <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1 rounded">Confirmed</span>
              </div>
              <div className="space-y-1.5 border-l-2 border-slate-200 pl-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pool Allocation</span>
                 <p className="text-xs font-bold text-slate-700">₹ 42,50,000 Utilized</p>
                 <div className="h-1 w-24 bg-slate-100 rounded-full mt-1">
                    <div className="h-full bg-slate-400 w-[85%] rounded-full"></div>
                 </div>
              </div>
              <div className="space-y-1.5 border-l-2 border-slate-200 pl-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Defaulter</span>
                 <p className="text-xs font-bold text-slate-700">Member #042 (₹ 2,400)</p>
                 <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-1 rounded italic">Notice Sent</span>
              </div>
              <div className="flex items-center justify-end">
                 <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:border-brand-blue hover:text-brand-blue transition-all shadow-sm">
                    Manage Cycle <ExternalLink size={12} />
                 </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const AuditRow = ({ time, actor, code, entity, details }) => (
  <tr className="border-b border-slate-50/50 hover:bg-slate-50/80 transition-colors">
    <td className="py-3 px-4 text-[11px] font-medium text-slate-400 font-mono italic">{time}</td>
    <td className="py-3 px-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
          <User size={12} className="text-slate-400" />
        </div>
        <span className="text-[12px] font-bold text-blue-600 hover:underline cursor-pointer">{actor}</span>
      </div>
    </td>
    <td className="py-3 px-4">
      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-mono">
        {code}
      </span>
    </td>
    <td className="py-3 px-4 text-[12px] font-bold text-slate-600">{entity}</td>
    <td className="py-3 px-4 text-[12px] text-slate-500">{details}</td>
  </tr>
);

const SystemMetric = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 group cursor-default">
    <Icon size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}:</span>
    <span className="text-[10px] font-mono font-bold text-slate-200">{value}</span>
  </div>
);

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden font-inter flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage="System Overview" />
        
        <div className="flex-1 flex flex-col overflow-y-auto relative">
          {/* Header */}
          <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-[#f6f8fb]/80 backdrop-blur-md z-20 border-b border-slate-100/50 w-full">
            <h1 className="text-xl font-bold text-[#1a2f55] tracking-tight">Administrator Command Center</h1>
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

          <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-20">
            
            {/* Stats Overview Bar */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <AdminStatCard title="Total Groups" value="142" trend="+12%" isUp={true} icon={Layers} />
              <AdminStatCard title="Active Members" value="2,840" trend="+5.4%" isUp={true} icon={Users} />
              <AdminStatCard title="Total Pool Value" value="₹ 4.82 Cr" trend="+18%" isUp={true} icon={CircleDollarSign} />
              <AdminStatCard title="System Defaults" value="1.24%" trend="-0.2%" isUp={false} icon={AlertOctagon} />
              <AdminStatCard title="Loans Outstanding" value="₹ 1.15 Cr" trend="+3.1%" isUp={true} icon={Activity} />
            </section>

            {/* Analytics Section */}
            <section className="grid grid-cols-12 gap-8 items-stretch">
               
               {/* Line Chart Card */}
               <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Loans Outstanding Trend</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic lowercase">Consolidated debt exposure across all groups</p>
                    </div>
                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase tracking-widest border border-emerald-100">Real-Time</span>
                  </div>

                  <div className="flex-1 min-h-[220px] w-full mt-4">
                    <svg className="w-full h-full" overflow="visible" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#1a2f55" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#1a2f55" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Grids */}
                        {[30, 60, 90, 120].map(y => (
                        <line key={y} x1="0%" y1={`${120-y}%`} x2="100%" y2={`${120-y}%`} stroke="#f1f5f9" strokeWidth="1" />
                        ))}
                        
                        {/* Area Fill */}
                        <path 
                        d="M 0 55 Q 100 45, 200 48 T 400 42 T 600 30 T 800 25 L 800 100 L 0 100 Z" 
                        fill="url(#chartGradient)" 
                        />

                        {/* Line */}
                        <path 
                        d="M 0 55 Q 100 45, 200 48 T 400 42 T 600 30 T 800 25" 
                        fill="none" 
                        stroke="#1a2f55" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        />

                        {/* Y-Axis labels */}
                        <text x="-30" y="5%" className="text-[9px] fill-slate-300 font-bold">120</text>
                        <text x="-30" y="30%" className="text-[9px] fill-slate-300 font-bold">90</text>
                        <text x="-30" y="55%" className="text-[9px] fill-slate-300 font-bold">60</text>
                        <text x="-30" y="80%" className="text-[9px] fill-slate-300 font-bold">30</text>
                        <text x="-30" y="100%" className="text-[9px] fill-slate-300 font-bold">0</text>

                        {/* X-Axis Labels */}
                        <foreignObject x="0" y="110%" width="100%" height="20">
                            <div className="flex justify-between items-center px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
                            </div>
                        </foreignObject>
                    </svg>
                  </div>
               </div>

               {/* Donut Chart Card */}
               <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-6">
                  <div className="w-full">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Group Status Distribution</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic lowercase text-center">Portfolio health by operational stage</p>
                  </div>

                  <div className="relative w-48 h-48 flex items-center justify-center mt-4">
                    <svg className="w-full h-full -rotate-90">
                        {/* Track */}
                        <circle cx="50%" cy="50%" r="40%" stroke="#f1f5f9" strokeWidth="22" fill="none" />
                        {/* Segments */}
                        <circle cx="50%" cy="50%" r="40%" stroke="#1a2f55" strokeWidth="22" fill="none" strokeDasharray="180 300" strokeDashoffset="0" strokeLinecap="round" />
                        <circle cx="50%" cy="50%" r="40%" stroke="#ef4444" strokeWidth="22" fill="none" strokeDasharray="20 300" strokeDashoffset="-185" strokeLinecap="round" />
                        <circle cx="50%" cy="50%" r="40%" stroke="#3b82f6" strokeWidth="22" fill="none" strokeDasharray="40 300" strokeDashoffset="-210" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stability</span>
                        <span className="text-2xl font-black text-slate-800">92%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 w-full border-t border-slate-100 pt-6 mt-2">
                     <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stability</span>
                        <span className="text-lg font-black text-slate-800">92%</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Risk Rating</span>
                        <span className="text-lg font-black text-blue-600">Low</span>
                     </div>
                  </div>
               </div>
            </section>

            {/* Active Group Table */}
            <section className="space-y-4">
               <h3 className="text-base font-extrabold text-[#1a2f55] tracking-tight ml-1">Active Group Overview</h3>
               <p className="text-[11px] font-bold text-slate-400 tracking-wide mt-1 italic -mt-3 ml-1">Monitoring progress and default metrics for active chit cycles</p>
               
               <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="py-3 pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Name</th>
                            <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Members</th>
                            <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chit Amount</th>
                            <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">Cycle Progress</th>
                            <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Rate</th>
                            <th className="py-3 pr-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <GroupRow name="Premium Alpha 50" members={20} amount="50,00,000" progress={85} status="Active" defaultRate="0.0" />
                        <GroupRow name="Retail Savings IX" members={50} amount="5,00,000" progress={20} status="Active" defaultRate="0.5" />
                        <GroupRow name="Fortune Growth B" members={25} amount="25,00,000" progress={95} status="Initiating" defaultRate="1.2" />
                        <GroupRow name="Elite Venture 1Cr" members={10} amount="1,00,00,000" progress={40} status="Delayed" defaultRate="4.5" />
                        <GroupRow name="Micro Support III" members={100} amount="1,00,000" progress={100} status="Completed" defaultRate="0.2" />
                    </tbody>
                  </table>
               </div>
            </section>

            {/* Audit Log Section */}
            <section className="space-y-4">
                <div className="flex items-end justify-between px-1">
                   <div>
                        <h3 className="text-base font-extrabold text-[#1a2f55] tracking-tight">Recent Audit Log</h3>
                        <p className="text-[11px] font-bold text-slate-400 tracking-wide mt-1 italic">Live WAL (Write-Ahead Log) synchronization from core kernel</p>
                   </div>
                   <button className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1.5 underline decoration-blue-200">
                      View Full Audit <ExternalLink size={12} />
                   </button>
                </div>

                <div className="bg-[#f8faff] rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-blue-100/30 border-b border-blue-100/50">
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TIMESTAMP</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ACTOR</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ACTION CODE</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ENTITY</th>
                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">DETAILS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AuditRow time="2026-04-17 14:22:01" actor="sys_foreman_02" code="WAL_WRITE" entity="Group_902" details="Auction distribution finalized for cycle 14." />
                            <AuditRow time="2026-04-17 14:18:45" actor="admin_krishna" code="KYC_APPROVE" entity="User_8812" details="Manual verification of PAN document successful." />
                            <AuditRow time="2026-04-17 14:05:12" actor="recovery_bot" code="TASK_RECALC" entity="Loan_442" details="Notice sent to member for 30-day default." />
                            <AuditRow time="2026-04-17 13:59:20" actor="sys_core" code="LEDGER_SYNC" entity="Pool_Root" details="End-of-hour rebalancing completed successfully." />
                            <AuditRow time="2026-04-17 13:45:00" actor="admin_system" code="SRC_AUDIT" entity="Kernel" details="Routine security scan: 0 vulnerabilities detected." />
                        </tbody>
                    </table>
                    <div className="p-3 bg-blue-50/50 flex items-center justify-center gap-2 border-t border-blue-100/50">
                        <Activity size={12} className="text-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">STREAMS ACTIVE: KERNEL_SYNC_OK</span>
                    </div>
                </div>
            </section>

          </main>
        </div>
      </div>

      {/* System Status Footer Bar */}
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
