/**
 * src/pages/shared/RiskAnalysis.jsx  (Employee_Admin-Desktop)
 *
 * Chit Fund Risk Analysis — pure SVG charts, no recharts dependency.
 * Matches the Employee/Admin desktop design system.
 */
import React, { useMemo } from 'react';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useRiskAnalysis, fmtInr } from '../../hooks/useRiskAnalysis';

// ── Colour helpers ─────────────────────────────────────────────────
const C = {
  navy:    '#1F3A6E',
  blue:    '#2E6DAD',
  success: '#0F6E56',
  warning: '#BA7517',
  danger:  '#C00000',
  border:  '#E2E8F0',
  light:   '#F1F5F9',
  muted:   '#94A3B8',
  text:    '#1E293B',
};

function scoreColor(score) {
  if (score >= 70) return C.success;
  if (score >= 40) return C.warning;
  return C.danger;
}

function minutesAgo(isoString) {
  if (!isoString) return null;
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diff < 1)  return 'just now';
  if (diff < 60) return `${diff} min ago`;
  const h = Math.floor(diff / 60);
  return `${h} hr${h > 1 ? 's' : ''} ago`;
}

// ── Health Score Card ──────────────────────────────────────────────
function HealthScoreCard({ result, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="w-32 h-6 rounded-lg bg-slate-200 animate-pulse" />
          <div className="w-64 h-4 rounded bg-slate-200 animate-pulse" />
          <div className="w-full h-3 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }
  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">
        <ShieldCheck className="mx-auto mb-3 opacity-30" size={40} />
        <p className="font-bold text-slate-500">No analysis yet</p>
        <p className="text-sm mt-1">Click "Run Analysis" to generate the first report.</p>
      </div>
    );
  }

  const score = result.healthScore;
  const col   = scoreColor(score);
  const r = 44, cx = 54, cy = 54, stroke = 8;
  const circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;

  const stBg  = result.healthStatus === 'Healthy' ? '#D1FAE5' : result.healthStatus === 'At Risk' ? '#FEF3C7' : '#FEE2E2';
  const stClr = result.healthStatus === 'Healthy' ? C.success  : result.healthStatus === 'At Risk' ? C.warning  : C.danger;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
      <div className="flex gap-8 items-center flex-wrap">
        {/* SVG circle */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <svg width={108} height={108}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.light} strokeWidth={stroke} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray .6s ease' }} />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight={900} fill={col}>{score}</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize={10} fill={C.muted}>/100</text>
          </svg>
          <span style={{ background: stBg, color: stClr }}
            className="text-xs font-bold px-4 py-1 rounded-full">
            {result.healthStatus}
          </span>
        </div>
        {/* Commentary */}
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm text-slate-500 leading-relaxed mb-3">{result.commentary}</p>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, backgroundColor: col }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0 — Critical</span><span>50 — At Risk</span><span>100 — Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KPI Strip ──────────────────────────────────────────────────────
function KPICard({ label, value, trendVal, inverse = false, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-1 min-w-[160px] animate-pulse">
        <div className="h-3 w-20 bg-slate-200 rounded mb-4" />
        <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-12 bg-slate-200 rounded" />
      </div>
    );
  }
  const isPositive = inverse ? trendVal <= 0 : trendVal >= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-1 min-w-[160px]">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-black text-[#1a2f55] mb-1">{value}</p>
      <span className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trendVal >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(trendVal).toFixed(1)}%
      </span>
    </div>
  );
}

function KPIStrip({ result, loading }) {
  return (
    <div className="flex flex-wrap gap-4">
      <KPICard label="Collection Rate"  value={`${result?.collectionRatePct  ?? '--'}%`} trendVal={2.1}  loading={loading} />
      <KPICard label="Default Rate"     value={`${result?.defaultRatePct     ?? '--'}%`} trendVal={-0.8} inverse loading={loading} />
      <KPICard label="Pool Utilisation" value={`${result?.poolUtilisationPct ?? '--'}%`} trendVal={1.4}  loading={loading} />
      <KPICard label="Avg Member Risk"  value={`${result?.avgMemberRiskScore ?? '--'}`}  trendVal={-3.2} inverse loading={loading} />
    </div>
  );
}

// ── SVG Bar Chart — Collection Trend ──────────────────────────────
function CollectionChart({ data, loading }) {
  if (loading) return <div className="h-56 w-full bg-slate-200 rounded-xl animate-pulse" />;
  if (!data || data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No trend data available</div>;
  }

  const W = 560, H = 200, pad = { top: 16, right: 12, bottom: 32, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map(d => Math.max(d.expected || 0, d.collected || 0)), 1);
  const groupW = innerW / data.length;
  const bw     = groupW * 0.35;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f));
  const yPos   = (v) => innerH - (v / maxVal) * innerH;
  const fmtK   = (v) => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={pad.left} y1={pad.top + yPos(t)} x2={W - pad.right} y2={pad.top + yPos(t)}
            stroke={C.border} strokeDasharray="3 3" />
          <text x={pad.left - 6} y={pad.top + yPos(t) + 4} textAnchor="end" fontSize={10} fill={C.muted}>{fmtK(t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pad.left + i * groupW + groupW * 0.1;
        const eh = Math.max(0, (d.expected / maxVal) * innerH);
        const ch = Math.max(0, (d.collected / maxVal) * innerH);
        return (
          <g key={d.month || i}>
            <rect x={x} y={pad.top + yPos(d.expected)} width={bw} height={eh} fill="#D0E4F7" rx={3} />
            <rect x={x + bw + 3} y={pad.top + yPos(d.collected)} width={bw} height={ch} fill={C.navy} rx={3} />
            <text x={x + bw} y={H - 6} textAnchor="middle" fontSize={10} fill={C.muted}>{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Donut — Risk Distribution ─────────────────────────────────
const DONUT_COLORS = [C.success, C.warning, C.danger];

function RiskDonut({ distribution, totalMembers, loading }) {
  const slices = useMemo(() => {
    if (!distribution) return [];
    return [
      { name: 'Low',    value: distribution.low    || 0, color: C.success },
      { name: 'Medium', value: distribution.medium || 0, color: C.warning },
      { name: 'High',   value: distribution.high   || 0, color: C.danger  },
    ].filter(d => d.value > 0);
  }, [distribution]);

  if (loading) return <div className="h-52 w-full bg-slate-200 rounded-xl animate-pulse" />;
  if (!distribution || slices.length === 0) {
    return <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data</div>;
  }

  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 90, cy = 90, r = 70, ir = 46;
  let startAngle = -Math.PI / 2;
  const paths = slices.map(s => {
    const angle = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(startAngle + angle), y2 = cy + r * Math.sin(startAngle + angle);
    const ix1 = cx + ir * Math.cos(startAngle), iy1 = cy + ir * Math.sin(startAngle);
    const ix2 = cx + ir * Math.cos(startAngle + angle), iy2 = cy + ir * Math.sin(startAngle + angle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`;
    startAngle += angle;
    return { ...s, d };
  });

  return (
    <div>
      <div className="relative">
        <svg viewBox="0 0 180 180" style={{ width: 180, height: 180, display: 'block', margin: '0 auto' }}>
          {paths.map(p => <path key={p.name} d={p.d} fill={p.color} />)}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={900} fill={C.navy}>{totalMembers}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fontWeight={700} fill={C.muted} letterSpacing={1}>MEMBERS</text>
        </svg>
      </div>
      <div className="flex justify-center gap-4 flex-wrap mt-2">
        {slices.map(s => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
            <span className="font-semibold">{s.name}</span>
            <span>({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pool Health Bar ────────────────────────────────────────────────
function PoolHealthBar({ poolHealth, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-4 w-28 bg-slate-200 rounded mb-4" />
        <div className="h-7 w-full bg-slate-200 rounded-xl mb-3" />
        <div className="flex gap-6">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }
  if (!poolHealth) return null;
  const { allocated, safeReserve, buffer, total, safeState } = poolHealth;
  const t = total || 1;
  const allocPct   = (allocated   / t) * 100;
  const reservePct = (safeReserve / t) * 100;
  const bufferPct  = (buffer      / t) * 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-[#1a2f55] text-sm">Pool Health</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${safeState ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {safeState ? '✓ Safe State' : '⚠ At Risk'}
        </span>
      </div>
      <div className="flex h-7 rounded-xl overflow-hidden mb-3">
        <div style={{ width: `${allocPct}%`,   backgroundColor: '#1F3A6E', transition: 'width 0.5s' }} />
        <div style={{ width: `${reservePct}%`, backgroundColor: '#2E6DAD', transition: 'width 0.5s' }} />
        <div style={{ width: `${bufferPct}%`,  backgroundColor: '#D0E4F7', transition: 'width 0.5s' }} />
      </div>
      <div className="flex flex-wrap gap-5">
        {[
          { label: 'Allocated',    val: allocated,   color: '#1F3A6E' },
          { label: 'Safe Reserve', val: safeReserve, color: '#2E6DAD' },
          { label: 'Buffer',       val: buffer,      color: '#94B8D8' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: item.color }} />
            <span>{item.label}:</span>
            <span className="font-bold text-slate-700">{fmtInr(item.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Member Risk Table ──────────────────────────────────────────────
function RiskPill({ level }) {
  const cls = level === 'Low'    ? 'bg-emerald-50 text-emerald-700'
            : level === 'Medium' ? 'bg-amber-50 text-amber-700'
            :                      'bg-rose-50 text-rose-700';
  return <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{level}</span>;
}

function TrendIcon({ trend }) {
  if (trend === 'improving') return <TrendingUp size={14} className="text-emerald-500" />;
  if (trend === 'worsening') return <TrendingDown size={14} className="text-rose-500" />;
  return <span className="text-slate-400 text-sm">→</span>;
}

function MemberRow({ member, isHighRisk }) {
  const initials = member.name
    ? member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  const barColor = member.riskLevel === 'Low' ? C.success : member.riskLevel === 'Medium' ? C.warning : C.danger;

  return (
    <tr className={`border-b border-slate-50 ${isHighRisk ? 'bg-rose-50/30' : 'bg-white'}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-[#1a2f55] flex items-center justify-center text-xs font-black flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm font-semibold text-slate-700">{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">—</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-700 w-7">{member.score}</span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
            <div className="h-full rounded-full" style={{ width: `${member.score}%`, backgroundColor: barColor }} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><RiskPill level={member.riskLevel} /></td>
      <td className="px-4 py-3"><TrendIcon trend={member.trend} /></td>
    </tr>
  );
}

function MemberRiskTable({ members, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 items-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 bg-slate-200 rounded" />
              <div className="h-2 w-24 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center text-slate-400">
        <p className="font-bold text-slate-500 mb-1">No member data available</p>
        <p className="text-sm">Run analysis to populate member risk scores.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <h3 className="font-black text-[#1a2f55] text-sm">Member Risk Scores</h3>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{members.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {['Member', 'Contributions', 'Risk Score', 'Risk Level', 'Trend'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member, i) => (
              <MemberRow key={member.uid || i} member={member} isHighRisk={i < 3 && member.riskLevel === 'High'} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function RiskAnalysis({ groupId = 'GRP-001' }) {
  const { analysisResult, loading, analysing, error, lastFetched, runAnalysis } = useRiskAnalysis(groupId);

  const lastAnalysedText = analysisResult?.analysedAt
    ? minutesAgo(analysisResult.analysedAt)
    : lastFetched ? minutesAgo(lastFetched.toISOString()) : null;

  const totalMembers = useMemo(() => {
    if (!analysisResult?.riskDistribution) return analysisResult?.memberScores?.length ?? 0;
    return (analysisResult.riskDistribution.low    || 0) +
           (analysisResult.riskDistribution.medium || 0) +
           (analysisResult.riskDistribution.high   || 0);
  }, [analysisResult]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f6f8fb] p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-[#1a2f55] tracking-tight">Chit Fund Risk Analysis</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Group ID: <strong>{groupId}</strong>
            {lastAnalysedText && <span className="ml-3">· Last analysed {lastAnalysedText}</span>}
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analysing}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
            analysing ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1a2f55] hover:bg-[#142445] cursor-pointer'
          }`}
        >
          {analysing && <Loader2 size={14} className="animate-spin" />}
          {analysing ? 'Analysing...' : '▶ Run Analysis'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Health Score */}
      <HealthScoreCard result={analysisResult} loading={loading} />

      {/* KPI Strip */}
      <KPIStrip result={analysisResult} loading={loading} />

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-[#1a2f55] text-sm mb-4">Collection Trend</h3>
          {loading
            ? <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
            : <CollectionChart data={analysisResult?.collectionTrend} loading={loading} />}
          <div className="flex gap-5 mt-3">
            {[['Expected', '#D0E4F7'], ['Collected', C.navy]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-[#1a2f55] text-sm mb-4">Member Risk Distribution</h3>
          <RiskDonut
            distribution={analysisResult?.riskDistribution}
            totalMembers={totalMembers}
            loading={loading}
          />
        </div>
      </div>

      {/* Pool Health */}
      <PoolHealthBar poolHealth={analysisResult?.poolHealth} loading={loading} />

      {/* Member Table */}
      <MemberRiskTable members={analysisResult?.memberScores} loading={loading} />
    </div>
  );
}
