/**
 * seed-user-data.mjs
 * ──────────────────────────────────────────────────────────────────────────
 * Writes randomised financial data fields (from user-data-fields.json schema)
 * into every document in the Firestore `users` collection.
 *
 * Uses the Firebase REST API — no Admin SDK or service account needed.
 * Matches users by the `email` field stored in each Firestore doc.
 *
 * Run from the Client folder:
 *   node data/seed-user-data.mjs
 * ──────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';

// ── Firebase config (mirrors .env) ────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:    'AIzaSyBaAtx7UDaIHfd4305M-5WJ7wb2NhPo_nk',
  projectId: 'transactflowos',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Pick a random integer between min and max (inclusive). */
const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Pick a random item from an array. */
const rPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Format a number as Indian rupee string e.g. 55000 → "₹55,000" */
function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN');
}

/** Return a date string N months from a base date */
function addMonths(base, n) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthLabel(year, month0) {
  return `${MONTH_NAMES[month0]} ${year}`;
}
function shortDate(day, month0, year) {
  return `${SHORT_MONTHS[month0]} ${String(day).padStart(2,'0')}, ${year}`;
}

// ── Random financial data generator ───────────────────────────────────────
function generateUserData(email) {
  const MONTHLY_AMOUNT = 5000;          // ₹5,000 fixed contribution per cycle
  const TOTAL_CYCLES   = 40;            // group total cycles
  const cyclesPaid     = rInt(6, 30);   // how many cycles this member has paid
  const totalContrib   = cyclesPaid * MONTHLY_AMOUNT;
  const remaining      = (TOTAL_CYCLES - cyclesPaid) * MONTHLY_AMOUNT;
  const remainingMonths = TOTAL_CYCLES - cyclesPaid;
  const streak         = rInt(2, cyclesPaid);
  const missed         = rInt(0, 2);
  const hasActiveLoan  = Math.random() < 0.35;   // 35% chance of active loan

  // Loan amounts (multiples of ₹10,000 between ₹20k and ₹2L)
  const activeLoanPrincipal = hasActiveLoan ? rInt(2, 20) * 10000 : 0;
  const activeLoanBalance   = hasActiveLoan ? rInt(1, activeLoanPrincipal / 10000 - 1) * 10000 : 0;

  // Next payment date — 10th of next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 10);
  const nextPaymentDate = nextMonth.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Build contribution history (most recent first) ─────────────────────
  const history = [];
  const baseYear  = 2024;
  const baseMonth = 9; // October 2024 = index 9

  for (let i = 0; i < Math.min(cyclesPaid + missed, 12); i++) {
    let month0 = (baseMonth - i + 12 * 4) % 12;
    let year   = baseYear - Math.floor((i - baseMonth + 12 * 4) / 12);
    if (baseMonth - i < 0) year -= 1;
    // simpler: offset directly
    const d = new Date(2024, 9 - i, 1);
    const mLabel = monthLabel(d.getFullYear(), d.getMonth());
    const dueDate = shortDate(10, d.getMonth(), d.getFullYear());
    const isOverdue = missed > 0 && i === rInt(1, Math.min(missed, 5));
    const paidDay = rInt(7, 12);
    const paidDate = isOverdue ? '--' : shortDate(paidDay, d.getMonth(), d.getFullYear());
    const ref = isOverdue ? '-' : `TXN-${rInt(800000, 900000)}`;
    history.push({
      month:        mLabel,
      date_due:     dueDate,
      date_paid:    paidDate,
      amount:       formatINR(MONTHLY_AMOUNT),
      status:       isOverdue ? 'Overdue' : 'Paid',
      reference_id: ref,
      type:         'Monthly',
    });
  }

  // ── Upcoming payments ──────────────────────────────────────────────────
  const upcoming = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(2024, 10 + i, 10);  // Nov, Dec, Jan
    upcoming.push({
      cycle_id: cyclesPaid + i + 1,
      date:     shortDate(10, d.getMonth(), d.getFullYear()),
      amount:   formatINR(MONTHLY_AMOUNT),
      type:     'STANDARD DUE',
    });
  }

  // ── Loan history ───────────────────────────────────────────────────────
  const loanPurposes = ['Medical', 'Home Repair', 'Business Expansion', 'Education', 'Personal'];
  const loanStatuses = hasActiveLoan
    ? ['Repaid', 'Repaid', 'Disbursed']
    : ['Repaid', 'Repaid'];

  const fullLoanHistory = loanStatuses.map((status, idx) => {
    const principal = rInt(2, 15) * 10000;
    const emi = Math.round(principal / 12 * 1.1 / 100) * 100;
    return {
      loan_id:     `LN-${rInt(1000, 9999)}`,
      principal:   formatINR(principal),
      purpose:     rPick(loanPurposes),
      applied_date: shortDate(rInt(1, 28), rInt(0, 11), 2023 + idx),
      status,
      monthly_emi: formatINR(emi),
    };
  });

  const recentLoanHistory = fullLoanHistory.slice(-2).map(l => ({
    disbursed_amount: l.principal,
    disbursed_date:   l.applied_date,
  }));

  // ── Assemble final object ──────────────────────────────────────────────
  return {
    profile: {
      savings_impact:        formatINR(Math.round(totalContrib * 1.05 / 1000) * 1000 / 100000 * 100000)
                               .replace('₹', '₹') + (totalContrib > 500000 ? 'L' : ''),
      current_streak_months: streak,
      missed_payments_count: missed,
      active_loan_status:    hasActiveLoan ? 'Active' : 'None',
    },
    financial_snapshot: {
      total_contributed:      formatINR(totalContrib),
      remaining_contribution: formatINR(remaining),
      remaining_months:       remainingMonths,
      active_loan_balance:    hasActiveLoan ? formatINR(activeLoanBalance) : '₹0.00',
      next_payment_due_date:  nextPaymentDate,
      next_payment_due_amount: formatINR(MONTHLY_AMOUNT),
    },
    loans_and_credit: {
      new_loan_estimated_emi:   formatINR(rInt(60, 120) * 100),
      new_loan_interest_rate:   `${(rInt(100, 140) / 10).toFixed(1)}%`,
      active_loan_balance_alert: hasActiveLoan ? formatINR(activeLoanBalance) : '₹0.00',
      recent_loan_history:      recentLoanHistory,
      full_loan_history:        fullLoanHistory,
    },
    contributions: {
      summary: {
        total_contributed:      formatINR(totalContrib),
        total_cycles:           cyclesPaid,
        missed_payments:        missed,
        payment_streak_months:  streak,
      },
      upcoming_payments: upcoming,
      recent_timeline:   history,
    },
  };
}

// ── Firestore REST helpers ─────────────────────────────────────────────────

/** Convert a plain JS value to Firestore REST value format */
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean')          return { booleanValue: val };
  if (typeof val === 'number')           return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string')           return { stringValue: val };
  if (Array.isArray(val))                return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/** Convert a plain JS object to Firestore fields map */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return fields;
}

/** List all docs in the `users` collection */
async function listUserDocs() {
  const url = `${BASE_URL}/users?key=${FIREBASE_CONFIG.apiKey}&pageSize=200`;
  const res  = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(`List users failed: ${JSON.stringify(json)}`);
  return json.documents || [];
}

/** PATCH (merge) fields into a Firestore document */
async function patchDocument(docPath, fieldsObj) {
  // Build updateMask query string
  const topKeys = Object.keys(fieldsObj);
  const maskParams = topKeys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/${docPath}?${maskParams}&key=${FIREBASE_CONFIG.apiKey}`;

  const body = JSON.stringify({ fields: toFirestoreFields(fieldsObj) });
  const res  = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
  const json = await res.json();
  if (!res.ok) throw new Error(`PATCH ${docPath} failed: ${JSON.stringify(json)}`);
  return json;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔥 Connecting to Firestore project:', FIREBASE_CONFIG.projectId);

  let docs;
  try {
    docs = await listUserDocs();
  } catch (err) {
    console.error('❌ Could not list users:', err.message);
    process.exit(1);
  }

  if (docs.length === 0) {
    console.warn('⚠️  No documents found in `users` collection. Exiting.');
    process.exit(0);
  }

  console.log(`📋 Found ${docs.length} user document(s). Seeding financial data...\n`);

  let success = 0;
  let failed  = 0;

  for (const doc of docs) {
    // doc.name = "projects/{proj}/databases/(default)/documents/users/{uid}"
    const uid   = doc.name.split('/').pop();
    const email = doc.fields?.email?.stringValue ?? '(no email)';
    const name  = doc.fields?.name?.stringValue  ?? uid;

    const data = generateUserData(email);

    try {
      await patchDocument(doc.name, data);
      console.log(`  ✅  ${name.padEnd(30)} (${uid.slice(0,8)}…) → seeded`);
      success++;
    } catch (err) {
      console.error(`  ❌  ${name.padEnd(30)} → FAILED: ${err.message}`);
      failed++;
    }

    // tiny delay to avoid hammering the API
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\n✨ Done! ${success} seeded, ${failed} failed.`);
}

main();
