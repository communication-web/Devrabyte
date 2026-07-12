import { Debt, Strategy } from './types';

export type PayoffResult = {
  months: number;
  payoffDate: Date;
  totalInterestPaid: number;
};

const MAX_MONTHS = 1200; // 100-year safety cap against runaway simulations

/** Orders active debts by strategy priority: smallest balance first (snowball) or highest APR first (avalanche). */
function prioritize(debts: Debt[], strategy: Strategy): Debt[] {
  const active = debts.filter((d) => d.currentBalance > 0.01);
  return [...active].sort((a, b) =>
    strategy === 'snowball' ? a.currentBalance - b.currentBalance : b.apr - a.apr
  );
}

/**
 * Simulates paying off `debts` under a fixed total monthly budget (sum of every debt's
 * minimum payment, plus `extraMonthly`). As each debt is paid off, its minimum payment
 * rolls into the budget available for the next priority debt, instead of shrinking the
 * total outgo — this is the "snowball"/"avalanche" rolling effect.
 *
 * Returns null if there's no debt to pay off, or if the budget can't outpace interest
 * within MAX_MONTHS (the debts would never be paid off at this rate).
 */
export function simulatePayoff(
  debts: Debt[],
  strategy: Strategy,
  extraMonthly: number,
  startDate: Date = new Date()
): PayoffResult | null {
  let working = debts
    .filter((d) => d.currentBalance > 0.01)
    .map((d) => ({ ...d }));

  if (working.length === 0) return null;

  const totalBudget = working.reduce((sum, d) => sum + d.minPayment, 0) + extraMonthly;
  let totalInterestPaid = 0;
  let months = 0;

  while (working.length > 0 && months < MAX_MONTHS) {
    months += 1;

    for (const debt of working) {
      const interest = (debt.currentBalance * debt.apr) / 100 / 12;
      debt.currentBalance += interest;
      totalInterestPaid += interest;
    }

    let remaining = totalBudget;
    for (const debt of working) {
      const payment = Math.min(debt.currentBalance, debt.minPayment);
      debt.currentBalance -= payment;
      remaining -= payment;
    }

    for (const debt of prioritize(working, strategy)) {
      if (remaining <= 0) break;
      const payment = Math.min(debt.currentBalance, remaining);
      debt.currentBalance -= payment;
      remaining -= payment;
    }

    working = working.filter((d) => d.currentBalance > 0.01);
  }

  if (working.length > 0) return null; // didn't converge within MAX_MONTHS

  const payoffDate = new Date(startDate);
  payoffDate.setMonth(payoffDate.getMonth() + months);

  return { months, payoffDate, totalInterestPaid };
}

/** Days between two dates, rounded to the nearest whole day. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
