/**
 * Reducing Balance EMI Calculator
 *
 * Formula: EMI = [P × r × (1 + r)^n] / [(1 + r)^n – 1]
 *   P = principal loan amount
 *   r = monthly interest rate (annual rate / 12 / 100)
 *   n = tenure in months
 */

export function calculateEMI(loanAmount, annualRate, tenureMonths) {
  // ── Edge-case guards ──────────────────────────────────────────────
  if (loanAmount <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalInterest: 0, totalPayment: 0, schedule: [] };
  }

  // If interest rate is 0, simple division
  if (annualRate === 0) {
    const emi = parseFloat((loanAmount / tenureMonths).toFixed(2));
    return {
      emi,
      totalInterest: 0,
      totalPayment: parseFloat(loanAmount.toFixed(2)),
      schedule: Array.from({ length: tenureMonths }, (_, i) => ({
        month: i + 1,
        emi,
        interest: 0,
        principal: emi,
        balance: parseFloat((loanAmount - emi * (i + 1)).toFixed(2)),
      })),
    };
  }

  // ── Core calculation ──────────────────────────────────────────────
  const monthlyRate = annualRate / 12 / 100;
  const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = parseFloat(
    ((loanAmount * monthlyRate * compoundFactor) / (compoundFactor - 1)).toFixed(2)
  );

  // ── Amortisation schedule ─────────────────────────────────────────
  let balance = loanAmount;
  let totalInterest = 0;
  const schedule = [];

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = parseFloat((balance * monthlyRate).toFixed(2));
    let principal = parseFloat((emi - interest).toFixed(2));

    // Last month: adjust for rounding residuals
    if (month === tenureMonths) {
      principal = parseFloat(balance.toFixed(2));
    }

    balance = parseFloat((balance - principal).toFixed(2));
    if (balance < 0) balance = 0;

    totalInterest += interest;

    schedule.push({
      month,
      emi: month === tenureMonths ? parseFloat((principal + interest).toFixed(2)) : emi,
      interest,
      principal,
      balance,
    });
  }

  totalInterest = parseFloat(totalInterest.toFixed(2));
  const totalPayment = parseFloat((loanAmount + totalInterest).toFixed(2));

  return { emi, totalInterest, totalPayment, schedule };
}
