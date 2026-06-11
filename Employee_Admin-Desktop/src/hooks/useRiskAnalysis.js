// src/hooks/useRiskAnalysis.js (Employee_Admin-Desktop)
// ─────────────────────────────────────────────────────────────────
// Same hook as Client version — only the firebase import path differs.
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// ── Indian Rupee formatter ────────────────────────────────────────
export function fmtInr(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  const n = Number(amount);
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return '₹' + n.toLocaleString('en-IN');
}

// ── Fallback rule-based result generator ─────────────────────────
function generateFallbackResult(payload) {
  const { groupId, memberContribs, monthlyTrend, loanSummary } = payload;
  const totalMembers = memberContribs.length;

  let totalExpected = 0, totalPaid = 0;
  for (const m of memberContribs) {
    for (const p of m.payments) {
      totalExpected += p.amountExpected || 0;
      totalPaid     += p.amountPaid    || 0;
    }
  }
  const collectionRate = totalExpected > 0
    ? Math.min(100, (totalPaid / totalExpected) * 100) : 100;

  const defaultedMembers = memberContribs.filter((m) =>
    m.payments.some((p) => p.status === 'missed')
  ).length;
  const defaultRate = totalMembers > 0 ? (defaultedMembers / totalMembers) * 100 : 0;

  const poolTotal      = totalExpected || 1;
  const poolAllocated  = loanSummary.totalAmountINR || 0;
  const poolUtilisation = Math.min(100, (poolAllocated / poolTotal) * 100);

  const memberScores = memberContribs.map((m) => {
    const missedCount   = m.payments.filter((p) => p.status === 'missed').length;
    const hasActiveLoan = loanSummary.activeLoanUids?.includes(m.uid) ?? false;
    let score = Math.min(100, Math.max(0, missedCount * 30 + (hasActiveLoan ? 10 : 0)));
    const riskLevel = score < 40 ? 'Low' : score < 70 ? 'Medium' : 'High';
    const trend     = missedCount === 0 ? 'improving' : missedCount <= 1 ? 'stable' : 'worsening';
    return { uid: m.uid, name: m.name, score, riskLevel, trend };
  });

  const avgMemberRiskScore = totalMembers > 0
    ? memberScores.reduce((s, m) => s + m.score, 0) / totalMembers : 0;

  const healthScore = Math.max(0, Math.floor(
    100 - (defaultRate * 0.4) - (avgMemberRiskScore * 0.3) - ((100 - collectionRate) * 0.3)
  ));
  const healthStatus = healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'At Risk' : 'Critical';

  const commentary = healthStatus === 'Healthy'
    ? `Group ${groupId} is performing well with strong collection rates and low defaults.`
    : healthStatus === 'At Risk'
    ? `Group ${groupId} shows elevated default risk — monitor ${defaultedMembers} member(s) closely.`
    : `Group ${groupId} is in a critical state with significant defaults. Immediate intervention required.`;

  const riskDistribution = {
    low:    memberScores.filter((m) => m.score <  40).length,
    medium: memberScores.filter((m) => m.score >= 40 && m.score < 70).length,
    high:   memberScores.filter((m) => m.score >= 70).length,
  };

  const poolBuffer    = Math.max(0, poolTotal - poolAllocated);
  const safeReserve   = Math.floor(poolTotal * 0.15);
  const poolSafeState = poolBuffer >= safeReserve;

  return {
    healthScore, healthStatus, commentary,
    collectionRatePct:  Math.round(collectionRate   * 10) / 10,
    defaultRatePct:     Math.round(defaultRate       * 10) / 10,
    poolUtilisationPct: Math.round(poolUtilisation   * 10) / 10,
    avgMemberRiskScore: Math.round(avgMemberRiskScore * 10) / 10,
    memberScores: memberScores.sort((a, b) => b.score - a.score),
    collectionTrend: monthlyTrend,
    riskDistribution,
    poolHealth: { allocated: poolAllocated, safeReserve, buffer: poolBuffer, total: poolTotal, safeState: poolSafeState },
    analysedAt: new Date().toISOString(),
  };
}

// ── Main hook ─────────────────────────────────────────────────────
export function useRiskAnalysis(groupId = 'GRP-001') {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [analysing,  setAnalysing]  = useState(false);
  const [error,      setError]      = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, 'risk_analysis', groupId);
    unsubRef.current = onSnapshot(docRef,
      (snap) => {
        if (snap.exists()) { setAnalysisResult(snap.data()); setLastFetched(new Date()); }
        setLoading(false);
      },
      (err) => { console.error('[useRiskAnalysis]', err); setLoading(false); }
    );
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [groupId]);

  const runAnalysis = async () => {
    setAnalysing(true); setError(null);
    try {
      const [contribSnap, usersSnap, loanSnap] = await Promise.all([
        getDocs(query(collection(db, 'contributions'), where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'users'),         where('groupId', '==', groupId))),
        getDocs(query(collection(db, 'loan_applications'), where('groupId', '==', groupId), where('status', 'in', ['Approved', 'Disbursed']))),
      ]);

      const contribDocs = contribSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const userDocs    = usersSnap.docs.map((d)   => ({ uid: d.id, ...d.data() }));
      const loanDocs    = loanSnap.docs.map((d)    => ({ id: d.id, ...d.data() }));

      const memberMap = {};
      for (const u of userDocs) memberMap[u.uid] = { uid: u.uid, name: u.name || u.email, userType: u.userType, payments: [] };
      for (const c of contribDocs) {
        if (!memberMap[c.memberUid]) memberMap[c.memberUid] = { uid: c.memberUid, name: c.memberName || c.memberUid, userType: 'member', payments: [] };
        memberMap[c.memberUid].payments.push({ month: c.cycleMonth, amountExpected: c.amountExpected || 0, amountPaid: c.amountPaid || 0, status: c.status || 'missed' });
      }

      const trendMap = {};
      for (const c of contribDocs) {
        const m = c.cycleMonth || 'Unknown';
        if (!trendMap[m]) trendMap[m] = { month: m, expected: 0, collected: 0 };
        trendMap[m].expected  += c.amountExpected || 0;
        trendMap[m].collected += c.amountPaid     || 0;
      }

      const payload = {
        groupId, totalMembers: Object.keys(memberMap).length,
        memberContribs: Object.values(memberMap),
        monthlyTrend: Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6),
        loanSummary: {
          totalActive: loanDocs.length,
          totalAmountINR: loanDocs.reduce((s, l) => s + (l.requestedAmountINR || 0), 0),
          defaultedCount: 0,
          activeLoanUids: loanDocs.map((l) => l.applicantUid),
        },
        analysisTimestamp: new Date().toISOString(),
      };

      // Step 5: *** AI MODEL ENDPOINT — to be implemented ***
      // const result = await callAnalysisAPI(payload);
      const result = generateFallbackResult(payload);

      await setDoc(doc(db, 'risk_analysis', groupId), result);
    } catch (err) {
      console.error('[useRiskAnalysis] runAnalysis error:', err);
      setError(err?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalysing(false);
    }
  };

  return { analysisResult, loading, analysing, error, lastFetched, runAnalysis };
}
