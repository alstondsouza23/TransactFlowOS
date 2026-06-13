/**
 * src/pages/shared/RiskAnalysis.jsx
 * Pure React + SVG charts — no recharts, no external chart library.
 * Data is sourced from the local risk-analysis-data.json file.
 */
import React, { Component, useState, useEffect } from 'react';
import riskJson from '../../../data/risk-analysis-data.json';

// ─────────────────────────────────────────────────────────────────
// Data normaliser — maps API response to what the charts expect
// ─────────────────────────────────────────────────────────────────
function normalise(raw) {
  // Runway: API uses { balance, projection } — charts expect { value, actual }
  const runway = (raw.bankruptcyDistance?.runway ?? []).map((r) => ({
    month:  r.month,
    value:  r.balance ?? r.projection ?? 0,
    actual: r.balance != null,
  }));

  return {
    ...raw,
    bankruptcyDistance: {
      ...raw.bankruptcyDistance,
      runway,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// Custom hook — fetch & auto-refresh
// ─────────────────────────────────────────────────────────────────
function useRiskData() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    try {
      setLoading(true);
      setData(normalise(riskJson));
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // refetch just re-applies the static JSON (no network call)
  const refetch = () => {
    try {
      setData(normalise(riskJson));
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message);
    }
  };

  return { data, loading, error, refetch, fetchedAt };
}

// ─────────────────────────────────────────────────────────────────
// Tokens & utils
// ─────────────────────────────────────────────────────────────────
const C = {
  navy:'#1F3A6E', blue:'#2E6DAD', success:'#0F6E56',
  warning:'#BA7517', danger:'#C00000',
  border:'#E2E8F0', text:'#1E293B', muted:'#64748B', light:'#F1F5F9',
};
const fmtInr = (n) => {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  return '₹' + v.toLocaleString('en-IN');
};
const scoreColor = (s) => (+s || 0) >= 70 ? C.success : (+s || 0) >= 40 ? C.warning : C.danger;

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
  catch { return iso; }
};

// ─────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────
function Skeleton({ h = 18, w = '100%', mb = 8 }) {
  return (
    <div style={{
      height: h, width: w, background: '#E2E8F0', borderRadius: 6,
      marginBottom: mb, animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  );
}

function LoadingPage() {
  return (
    <div style={{ fontFamily: '"Inter",sans-serif', padding: 24 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      <Skeleton h={28} w={260} mb={12} />
      <Skeleton h={14} w={180} mb={28} />
      <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:24, marginBottom:18 }}>
        <Skeleton h={108} w={108} mb={16} />
        <Skeleton h={14} mb={8} />
        <Skeleton h={14} w="70%" mb={8} />
      </div>
      {[1,2,3].map(i => <Skeleton key={i} h={80} mb={14} />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Error state
// ─────────────────────────────────────────────────────────────────
function ErrorPage({ message, onRetry }) {
  return (
    <div style={{ fontFamily:'"Inter",sans-serif', padding:40, textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
      <h2 style={{ color: C.danger, fontSize:18, marginBottom:8 }}>Could not load risk analysis</h2>
      <p style={{ color: C.muted, fontSize:13, marginBottom:20, maxWidth:400, margin:'0 auto 20px' }}>
        {message}
      </p>
      <button onClick={onRetry}
        style={{ padding:'10px 24px', background:C.navy, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>
        Retry
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Error Boundary
// ─────────────────────────────────────────────────────────────────
class EB extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e, i) { console.error('[RiskAnalysis]', e, i); }
  render() {
    if (this.state.err) return (
      <div style={{ padding: 32, color: C.danger, fontFamily: 'Inter,sans-serif' }}>
        <b>⚠ {this.state.err.message}</b>
        <button onClick={() => this.setState({ err: null })}
          style={{ display:'block', marginTop:12, padding:'8px 18px', background:C.navy, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>
          Retry
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────
const Card = ({ children, pad = 22, style = {} }) => (
  <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14,
    boxShadow:'0 2px 8px rgba(0,0,0,.06)', padding:pad, ...style }}>
    {children}
  </div>
);
const H = ({ children }) => (
  <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:14 }}>{children}</div>
);

// ─────────────────────────────────────────────────────────────────
// 1. Health Score
// ─────────────────────────────────────────────────────────────────
function HealthCard() {
  const DATA = useData();
  const { score, status, commentary } = DATA.healthScore;
  const col   = scoreColor(score);
  const stBg  = status === 'Healthy' ? '#D1FAE5' : status === 'At Risk' ? '#FEF3C7' : '#FEE2E2';
  const stClr = status === 'Healthy' ? C.success  : status === 'At Risk' ? C.warning  : C.danger;
  // SVG arc for score circle
  const r = 44, cx = 54, cy = 54, stroke = 8;
  const circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <Card>
      <div style={{ display:'flex', gap:28, alignItems:'center', flexWrap:'wrap' }}>
        {/* SVG circle */}
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <svg width={108} height={108}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.light} strokeWidth={stroke} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`} style={{ transition:'stroke-dasharray .6s ease' }} />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight={900} fill={col}>{score}</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize={10} fill={C.muted}>/100</text>
          </svg>
          <span style={{ display:'inline-block', padding:'4px 16px', borderRadius:20, background:stBg, color:stClr, fontWeight:700, fontSize:12 }}>{status}</span>
        </div>
        {/* Text */}
        <div style={{ flex:1, minWidth:200 }}>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, marginBottom:14 }}>{commentary}</p>
          <div style={{ height:10, background:C.light, borderRadius:6, overflow:'hidden', marginBottom:5 }}>
            <div style={{ width:`${score}%`, height:'100%', background:col, borderRadius:6, transition:'width .6s' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted }}>
            <span>0 — Critical</span><span>50 — At Risk</span><span>100 — Healthy</span>
          </div>
        </div>
        {/* Quick stats */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:155 }}>
          {[
            ['Total Members', DATA.meta.totalMembers],
            ['Chit Value',    fmtInr(DATA.meta.chitValue)],
            ['Cycle',         `${DATA.meta.cycleMonth} / ${DATA.meta.totalCycles}`],
            ['Active Loans',  DATA.kpis.activeLoans],
          ].map(([l, v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
              <span style={{ fontSize:12, color:C.muted }}>{l}</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// 2. KPI Strip
// ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, trend, inverse, sub }) {
  const good = inverse ? trend <= 0 : trend >= 0;
  return (
    <Card style={{ flex:'1 1 148px' }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:900, color:C.navy, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{sub}</div>}
      <span style={{ fontSize:12, fontWeight:700, color:good ? C.success : C.danger }}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
      </span>
    </Card>
  );
}
function KPIStrip() {
  const DATA = useData();
  const k = DATA.kpis;
  return (
    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
      <KPICard label="Collection Rate"  value={`${k.collectionRatePct}%`}  trend={k.collectionRateTrend}  sub={fmtInr(k.totalCollectedINR)+' collected'} />
      <KPICard label="Default Rate"     value={`${k.defaultRatePct}%`}     trend={k.defaultRateTrend}     inverse sub={fmtInr(k.totalExpectedINR-k.totalCollectedINR)+' gap'} />
      <KPICard label="Pool Utilisation" value={`${k.poolUtilisationPct}%`} trend={k.poolUtilisationTrend} sub={fmtInr(k.totalLoanAmountINR)+' in loans'} />
      <KPICard label="Avg Member Risk"  value={`${k.avgMemberRiskScore}`}  trend={k.avgMemberRiskTrend}   inverse sub="risk score / 100" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3. SVG Bar Chart — Monthly Collection
// ─────────────────────────────────────────────────────────────────
function BarChartSVG() {
  const DATA = useData();
  const data  = DATA.collectionTrend;
  const W = 560, H2 = 200, pad = { top:16, right:12, bottom:32, left:52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H2 - pad.top - pad.bottom;
  const maxVal = 100000;
  const groupW = innerW / data.length;
  const bw     = groupW * 0.35;
  const yTicks = [0, 25000, 50000, 75000, 100000];
  const yPos   = (v) => innerH - (v / maxVal) * innerH;
  const fmtK   = (v) => v >= 1000 ? `₹${v/1000}k` : `₹${v}`;

  return (
    <svg viewBox={`0 0 ${W} ${H2}`} style={{ width:'100%', height:'auto' }}>
      {/* Grid lines */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={pad.left} y1={pad.top+yPos(t)} x2={W-pad.right} y2={pad.top+yPos(t)}
            stroke={C.border} strokeDasharray="3 3" />
          <text x={pad.left-6} y={pad.top+yPos(t)+4} textAnchor="end" fontSize={10} fill={C.muted}>{fmtK(t)}</text>
        </g>
      ))}
      {/* Bars */}
      {data.map((d, i) => {
        const x = pad.left + i * groupW + groupW * 0.1;
        return (
          <g key={d.month}>
            {/* Expected */}
            <rect x={x} y={pad.top + yPos(d.expected)} width={bw} height={(d.expected/maxVal)*innerH}
              fill="#D0E4F7" rx={3} />
            {/* Collected */}
            <rect x={x + bw + 3} y={pad.top + yPos(d.collected)} width={bw} height={(d.collected/maxVal)*innerH}
              fill={C.navy} rx={3} />
            <text x={x + bw} y={H2 - 6} textAnchor="middle" fontSize={10} fill={C.muted}>{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CollChart() {
  return (
    <Card style={{ flex:'1 1 55%', minWidth:260 }}>
      <H>Monthly Collection Trend</H>
      <BarChartSVG />
      <div style={{ display:'flex', gap:20, marginTop:10 }}>
        {[['Expected','#D0E4F7'],['Collected',C.navy]].map(([l, c]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.muted }}>
            <span style={{ width:12, height:12, borderRadius:3, background:c, display:'inline-block' }} />{l}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// 4. SVG Donut Chart — Risk Distribution
// ─────────────────────────────────────────────────────────────────
function DonutSVG() {
  const DATA = useData();
  const { low, medium, high } = DATA.riskDistribution;
  const total = low + medium + high;
  const slices = [
    { value: low,    color: C.success, label: 'Low'    },
    { value: medium, color: C.warning, label: 'Medium' },
    { value: high,   color: C.danger,  label: 'High'   },
  ];
  const cx = 90, cy = 90, r = 70, ir = 46;

  let startAngle = -Math.PI / 2;
  const paths = slices.map(s => {
    const angle = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(startAngle + angle);
    const y2 = cy + r * Math.sin(startAngle + angle);
    const ix1 = cx + ir * Math.cos(startAngle);
    const iy1 = cy + ir * Math.sin(startAngle);
    const ix2 = cx + ir * Math.cos(startAngle + angle);
    const iy2 = cy + ir * Math.sin(startAngle + angle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`;
    startAngle += angle;
    return { ...s, d };
  });

  return (
    <svg viewBox="0 0 180 180" style={{ width:180, height:180, flexShrink:0 }}>
      {paths.map(p => <path key={p.label} d={p.d} fill={p.color} />)}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={900} fill={C.navy}>{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fontWeight={700} fill={C.muted} letterSpacing={1}>MEMBERS</text>
    </svg>
  );
}

function Donut() {
  const DATA = useData();
  const { low, medium, high } = DATA.riskDistribution;
  return (
    <Card style={{ flex:'1 1 35%', minWidth:220 }}>
      <H>Member Risk Distribution</H>
      <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
        <DonutSVG />
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[['Low', low, C.success],['Medium', medium, C.warning],['High', high, C.danger]].map(([l,v,c]) => (
            <div key={l}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:24, marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:C.muted }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block' }} />
                  {l} Risk
                </div>
                <span style={{ fontWeight:700, fontSize:13, color:C.text }}>{v}</span>
              </div>
              <div style={{ height:5, background:C.light, borderRadius:3, overflow:'hidden', width:100 }}>
                <div style={{ width:`${(v/(low+medium+high))*100}%`, height:'100%', background:c, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// 5. Bankruptcy / Runway Chart (pure SVG area chart)
// ─────────────────────────────────────────────────────────────────
function BankruptcyChart() {
  const DATA = useData();
  const bk = DATA.bankruptcyDistance;
  const pct = bk.safetyMarginPct;
  const stClr = pct > 60 ? C.success : pct > 30 ? C.warning : C.danger;
  const stBg  = pct > 60 ? '#D1FAE5'  : pct > 30 ? '#FEF3C7'  : '#FEE2E2';
  const stat  = pct > 60 ? 'Safe'      : pct > 30 ? 'Caution'   : 'Danger';

  // SVG area chart
  const W = 680, H2 = 220;
  const pad = { top:20, right:80, bottom:36, left:64 };
  const iW = W - pad.left - pad.right;
  const iH = H2 - pad.top - pad.bottom;
  const data = bk.runway;
  const maxV = Math.max(...data.map(d => d.value)) * 1.1;
  const minV = 0;
  const xStep = iW / (data.length - 1);
  const yPos = (v) => iH - ((v - minV) / (maxV - minV)) * iH;
  const pts = data.map((d, i) => `${pad.left + i * xStep},${pad.top + yPos(d.value)}`).join(' ');
  const areaPath = `M ${pad.left + 0 * xStep},${pad.top + yPos(data[0].value)} ` +
    data.map((d, i) => `L ${pad.left + i * xStep},${pad.top + yPos(d.value)}`).join(' ') +
    ` L ${pad.left + (data.length-1)*xStep},${pad.top + iH} L ${pad.left},${pad.top + iH} Z`;
  const splitIdx = data.findIndex(d => !d.actual);
  const actualPts = data.slice(0, splitIdx + 1).map((d, i) => `${pad.left + i * xStep},${pad.top + yPos(d.value)}`).join(' ');
  const projPts   = data.slice(splitIdx).map((d, i) => `${pad.left + (splitIdx + i) * xStep},${pad.top + yPos(d.value)}`).join(' ');
  const yMin  = pad.top + yPos(bk.minimumViableReserveINR);
  const yCrit = pad.top + yPos(bk.criticalThresholdINR);
  const yTicks = [0, 100000, 200000, 300000, 400000];
  const fmtK = (v) => v >= 1e5 ? `₹${(v/1e5).toFixed(1)}L` : v >= 1000 ? `₹${v/1000}k` : `₹${v}`;

  return (
    <Card>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <H>Bankruptcy Distance &amp; Pool Runway</H>
          <p style={{ fontSize:12, color:C.muted, marginTop:-8 }}>
            12-month projection at {fmtInr(bk.netMonthlyBurnINR)}/month net burn
          </p>
        </div>
        <span style={{ padding:'5px 16px', borderRadius:20, background:stBg, color:stClr, fontWeight:700, fontSize:13 }}>
          {stat} — {pct}% safety margin
        </span>
      </div>

      {/* Metric row */}
      <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:20, flexWrap:'wrap' }}>
        {[
          ['Current Balance',       fmtInr(bk.currentPoolBalanceINR),       C.navy   ],
          ['Min. Viable Reserve',   fmtInr(bk.minimumViableReserveINR),     C.warning],
          ['Critical Threshold',    fmtInr(bk.criticalThresholdINR),         C.danger ],
          ['Months to Min Reserve', `${bk.projectedMonthsToMinViable} mo`,   C.blue   ],
          ['Months to Critical',    `${bk.projectedMonthsToCritical} mo`,    C.danger ],
        ].map(([label, val, col], i, arr) => (
          <div key={label} style={{ flex:'1 1 90px', padding:'11px 14px', borderRight:i<arr.length-1?`1px solid ${C.border}`:'none' }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:.7, marginBottom:5 }}>{label}</div>
            <div style={{ fontSize:14, fontWeight:800, color:col }}>{val}</div>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width:'100%', height:'auto' }}>
        <defs>
          <linearGradient id="bkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={C.navy} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={C.navy} stopOpacity="0.01"/>
          </linearGradient>
          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={C.blue} stopOpacity="0.14"/>
            <stop offset="100%" stopColor={C.blue} stopOpacity="0.01"/>
          </linearGradient>
        </defs>

        {/* Y gridlines */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={pad.left} y1={pad.top+yPos(t)} x2={W-pad.right} y2={pad.top+yPos(t)} stroke={C.border} strokeDasharray="3 3"/>
            <text x={pad.left-6} y={pad.top+yPos(t)+4} textAnchor="end" fontSize={10} fill={C.muted}>{fmtK(t)}</text>
          </g>
        ))}

        {/* Shaded area */}
        <path d={areaPath} fill="url(#bkGrad)" />

        {/* Reference lines */}
        <line x1={pad.left} y1={yMin} x2={W-pad.right} y2={yMin} stroke={C.warning} strokeDasharray="7 4" strokeWidth={1.5}/>
        <text x={W-pad.right+4} y={yMin+4} fontSize={9} fill={C.warning} fontWeight={700}>Min Reserve</text>
        <line x1={pad.left} y1={yCrit} x2={W-pad.right} y2={yCrit} stroke={C.danger}  strokeDasharray="5 3" strokeWidth={1.5}/>
        <text x={W-pad.right+4} y={yCrit+4} fontSize={9} fill={C.danger}  fontWeight={700}>Critical</text>

        {/* Actual line (solid navy) */}
        {splitIdx > 0 && <polyline points={actualPts} fill="none" stroke={C.navy} strokeWidth={2.5} strokeLinejoin="round"/>}
        {/* Projected line (dashed blue) */}
        <polyline points={projPts} fill="none" stroke={C.blue} strokeWidth={2} strokeDasharray="7 4" strokeLinejoin="round"/>

        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={pad.left + i * xStep} cy={pad.top + yPos(d.value)}
            r={d.actual ? 5 : 3.5}
            fill={d.actual ? C.navy : C.blue}
            stroke="#fff" strokeWidth={1.5}/>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={pad.left + i * xStep} y={H2 - 6} textAnchor="middle" fontSize={10} fill={C.muted}>{d.month}</text>
        ))}

        {/* Danger zone shading */}
        <rect x={pad.left} y={yCrit} width={iW} height={pad.top+iH-yCrit} fill={C.danger} fillOpacity="0.04"/>
      </svg>

      {/* Legend */}
      <div style={{ display:'flex', gap:20, marginTop:12, flexWrap:'wrap' }}>
        {[
          ['Actual Balance',    C.navy,    false],
          ['Projected Balance', C.blue,    true ],
          ['Min. Viable',       C.warning, true ],
          ['Critical Zone',     C.danger,  false, true],
        ].map(([l, c, dash, fill]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.muted }}>
            {fill
              ? <span style={{ width:16, height:10, background:c, opacity:.25, borderRadius:2, display:'inline-block', border:`1px solid ${c}` }} />
              : <svg width={22} height={4}>
                  {dash
                    ? <line x1="0" y1="2" x2="22" y2="2" stroke={c} strokeWidth="2" strokeDasharray="5 3"/>
                    : <line x1="0" y1="2" x2="22" y2="2" stroke={c} strokeWidth="3"/>}
                </svg>
            }
            {l}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// 6. Pool Health Bar
// ─────────────────────────────────────────────────────────────────
function PoolBar() {
  const DATA = useData();
  const p = DATA.poolHealth, t = p.total || 1;
  const segs = [
    { label:'Disbursed to Winners', val:p.disbursedToWinners, color:'#1F3A6E' },
    { label:'Held in Loans',        val:p.heldInLoans,        color:'#2E6DAD' },
    { label:'Safe Reserve',         val:p.safeReserve,        color:'#5B9BD5' },
    { label:'Buffer',               val:p.buffer,             color:'#D0E4F7', dark:true },
  ];
  return (
    <Card>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <H>Pool Health Breakdown</H>
        <span style={{ padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700,
          background:p.safeState?'#D1FAE5':'#FEE2E2', color:p.safeState?C.success:C.danger }}>
          {p.safeState ? '✓ Safe State' : '⚠ At Risk'}
        </span>
      </div>
      <div style={{ display:'flex', height:32, borderRadius:8, overflow:'hidden', marginBottom:14 }}>
        {segs.map(s => (
          <div key={s.label} style={{ width:`${(s.val/t)*100}%`, background:s.color,
            border:s.dark?`1px solid ${C.border}`:undefined }} />
        ))}
      </div>
      <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
        {segs.map(s => (
          <div key={s.label} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.muted }}>
            <span style={{ width:11, height:11, borderRadius:3, background:s.color, display:'inline-block', border:`1px solid ${C.border}` }} />
            {s.label}: <strong style={{ color:C.text, marginLeft:3 }}>{fmtInr(s.val)}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// 7. Member Risk Table
// ─────────────────────────────────────────────────────────────────
function MemberRow({ m, rank }) {
  const sc   = +m.score || 0;
  const lvl  = m.riskLevel;
  const lvlBg  = lvl==='Low'?'#D1FAE5':lvl==='Medium'?'#FEF3C7':'#FEE2E2';
  const lvlClr = lvl==='Low'?C.success :lvl==='Medium'?C.warning :C.danger;
  const trClr  = m.trend==='improving'?C.success:m.trend==='worsening'?C.danger:C.muted;
  const init   = m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <tr style={{ background:lvl==='High'&&rank<3?'#FFF8F8':'#fff', borderBottom:`1px solid ${C.border}` }}>
      <td style={{ padding:'11px 16px', color:C.muted, fontSize:12 }}>#{rank+1}</td>
      <td style={{ padding:'11px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:C.light, color:C.navy,
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, flexShrink:0 }}>{init}</div>
          <div>
            <div style={{ fontWeight:600, fontSize:13, color:C.text }}>{m.name}</div>
            {m.activeLoan && <div style={{ fontSize:11, color:C.blue }}>Loan: {fmtInr(m.loanAmountINR)}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding:'11px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontWeight:800, fontSize:13, color:scoreColor(sc), width:28 }}>{sc}</span>
          <div style={{ flex:1, height:6, background:C.light, borderRadius:3, overflow:'hidden', minWidth:70 }}>
            <div style={{ width:`${sc}%`, height:'100%', background:scoreColor(sc), borderRadius:3 }} />
          </div>
        </div>
      </td>
      <td style={{ padding:'11px 16px' }}>
        <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:lvlBg, color:lvlClr }}>{lvl}</span>
      </td>
      <td style={{ padding:'11px 16px', fontSize:13, color:C.muted, textAlign:'center' }}>{m.missedPayments}</td>
      <td style={{ padding:'11px 16px', fontSize:13, fontWeight:700, color:trClr }}>
        {m.trend==='improving'?'↑ Improving':m.trend==='worsening'?'↓ Worsening':'→ Stable'}
      </td>
    </tr>
  );
}

function MemberTable() {
  const DATA = useData();
  const members = [...DATA.memberScores].sort((a,b) => b.score - a.score);
  return (
    <Card pad={0}>
      <div style={{ padding:'16px 22px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontWeight:700, fontSize:14, color:C.text }}>Member Risk Scores</span>
        <span style={{ background:C.light, color:C.muted, fontSize:11, fontWeight:700, borderRadius:20, padding:'2px 8px' }}>{members.length}</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:14 }}>
          {[['High',C.danger],['Medium',C.warning],['Low',C.success]].map(([l,c]) => (
            <span key={l} style={{ fontSize:12, color:c, fontWeight:700 }}>
              ● {l}: {members.filter(m=>m.riskLevel===l).length}
            </span>
          ))}
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:C.light }}>
              {['#','Member','Risk Score','Risk Level','Missed','Trend'].map(h => (
                <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => <MemberRow key={m.uid} m={m} rank={i}/>)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// Root — data-driven
// ─────────────────────────────────────────────────────────────────

// All chart sub-components read from this context instead of a global DATA const
const RiskCtx = React.createContext(null);
const useData = () => React.useContext(RiskCtx);

// Patch every component that previously read `DATA` directly to use useData()
// (All sub-components below reference `DATA` — we alias it per render via context)

function Page({ DATA }) {
  return (
    <div style={{ fontFamily:'"Inter",sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, margin:0 }}>Chit Fund Risk Analysis</h1>
          <p style={{ fontSize:12, color:C.muted, marginTop:4 }}>
            {DATA.meta.groupName} · {DATA.meta.groupId} · Analysed: {fmtDate(DATA.meta.analysedAt)}
          </p>
        </div>
        <span style={{ padding:'6px 14px', borderRadius:8, background:'#DBEAFE', color:'#1D4ED8', fontSize:12, fontWeight:700 }}>
          AI Model · Live Data
        </span>
      </div>

      <div style={{ marginBottom:18 }}><HealthCard /></div>
      <div style={{ marginBottom:18 }}><KPIStrip /></div>
      <div style={{ display:'flex', gap:18, marginBottom:18, flexWrap:'wrap' }}>
        <CollChart />
        <Donut />
      </div>
      <div style={{ marginBottom:18 }}><BankruptcyChart /></div>
      <div style={{ marginBottom:18 }}><PoolBar /></div>
      <MemberTable />
    </div>
  );
}

export default function RiskAnalysis() {
  const { data, loading, error, refetch, fetchedAt } = useRiskData();

  if (loading && !data) return <EB><LoadingPage /></EB>;
  if (error   && !data) return <EB><ErrorPage message={error} onRetry={refetch} /></EB>;

  return (
    <EB>
      <RiskCtx.Provider value={data}>
        {loading && data && (
          <div style={{ background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:8,
            padding:'6px 14px', fontSize:12, color:'#92400E', marginBottom:12, fontWeight:600 }}>
            Refreshing risk data…
          </div>
        )}
        {error && data && (
          <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius:8,
            padding:'6px 14px', fontSize:12, color:C.danger, marginBottom:12, fontWeight:600,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Could not refresh: {error}</span>
            <button onClick={refetch} style={{ background:'none', border:'none', cursor:'pointer',
              fontWeight:700, color:C.danger, textDecoration:'underline' }}>Retry</button>
          </div>
        )}
        <_InnerPage fetchedAt={fetchedAt} refetch={refetch} />
      </RiskCtx.Provider>
    </EB>
  );
}

// Inner page — reads from RiskCtx so header can show meta + refresh button
function _InnerPage({ fetchedAt, refetch }) {
  const DATA = useData();
  return (
    <div style={{ fontFamily:'"Inter",sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, margin:0 }}>Chit Fund Risk Analysis</h1>
          <p style={{ fontSize:12, color:C.muted, marginTop:4 }}>
            {DATA.meta.groupName} · {DATA.meta.groupId} · Analysed: {fmtDate(DATA.meta.analysedAt)}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {fetchedAt && (
            <span style={{ fontSize:11, color:C.muted }}>
              Updated {fetchedAt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          <button onClick={refetch}
            style={{ padding:'5px 14px', background:C.navy, color:'#fff', border:'none',
              borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Refresh
          </button>
          <span style={{ padding:'6px 14px', borderRadius:8, background:'#DBEAFE', color:'#1D4ED8', fontSize:12, fontWeight:700 }}>
            Data from AI Risk Analysis
          </span>
        </div>
      </div>

      <div style={{ marginBottom:18 }}><HealthCard /></div>
      <div style={{ marginBottom:18 }}><KPIStrip /></div>
      <div style={{ display:'flex', gap:18, marginBottom:18, flexWrap:'wrap' }}>
        <CollChart />
        <Donut />
      </div>
      <div style={{ marginBottom:18 }}><BankruptcyChart /></div>
      <div style={{ marginBottom:18 }}><PoolBar /></div>
      <MemberTable />
    </div>
  );
}
