import type {
  AccountBalanceSummary,
  Bill,
  BillMetrics,
  BillsSummary,
  DepositYieldMetrics,
  GoalMetrics,
  MutationResult,
  MutationRow,
  NetWorthBreakdown,
  SavingsGoal,
  TimeDeposit,
  Transaction
} from '../types/finance';

/**
 * Ensures any numerical input is stored and computed as a whole integer in Rupiah.
 */
export function toWholeRupiah(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

/**
 * 1. Liquid Balance (calculateLiquidBalance)
 * Total Income minus Total Expense across all or a specific account.
 */
export function calculateLiquidBalance(
  transactions: readonly Transaction[],
  accountFilter?: string
): number {
  let total = 0;
  for (const tx of transactions) {
    if (accountFilter && accountFilter !== 'ALL' && tx.account !== accountFilter) {
      continue;
    }
    const amt = toWholeRupiah(tx.amount);
    if (tx.type === 'income') {
      total += amt;
    } else {
      total -= amt;
    }
  }
  return total;
}

/**
 * 2. Account Breakdown (calculateBalancesByAccount)
 * Computes total inflow, total outflow, and current ending balance for each individual account.
 */
export function calculateBalancesByAccount(
  transactions: readonly Transaction[],
  configuredAccounts: readonly string[]
): AccountBalanceSummary[] {
  const map = new Map<
    string,
    { inflow: number; outflow: number; count: number }
  >();

  for (const acc of configuredAccounts) {
    map.set(acc, { inflow: 0, outflow: 0, count: 0 });
  }

  for (const tx of transactions) {
    const existing = map.get(tx.account) ?? { inflow: 0, outflow: 0, count: 0 };
    const amt = toWholeRupiah(tx.amount);
    if (tx.type === 'income') {
      existing.inflow += amt;
    } else {
      existing.outflow += amt;
    }
    existing.count += 1;
    map.set(tx.account, existing);
  }

  const positiveTotal = Array.from(map.values()).reduce((acc, item) => {
    const bal = item.inflow - item.outflow;
    return bal > 0 ? acc + bal : acc;
  }, 0);

  const summaries: AccountBalanceSummary[] = [];
  for (const [account, stats] of map.entries()) {
    const endingBalance = stats.inflow - stats.outflow;
    const sharePercentage =
      positiveTotal > 0 && endingBalance > 0
        ? Math.round((endingBalance / positiveTotal) * 1000) / 10
        : 0;
    summaries.push({
      account,
      totalInflow: stats.inflow,
      totalOutflow: stats.outflow,
      endingBalance,
      sharePercentage,
      transactionCount: stats.count
    });
  }

  return summaries.sort((a, b) => b.endingBalance - a.endingBalance);
}

/**
 * 3. Chronological Running Balance (calculateMutationWithRunningBalance)
 * Given a list of transactions and a date/account filter:
 * - Computes openingBalance (all transactions strictly before startDate).
 * - Sorts filtered transactions chronologically (date ASC, then creation order).
 * - Computes runningBalance after each row (previousBalance + income - expense).
 * - Returns { openingBalance, totalCredit, totalDebit, netCashflow, endingBalance, rows }.
 */
export function calculateMutationWithRunningBalance(
  transactions: readonly Transaction[],
  options: {
    startDate?: string;
    endDate?: string;
    account?: string;
    searchQuery?: string;
    category?: string;
    typeFilter?: 'ALL' | 'income' | 'expense';
  } = {}
): MutationResult {
  const {
    startDate,
    endDate,
    account = 'ALL',
    searchQuery = '',
    category = 'ALL',
    typeFilter = 'ALL'
  } = options;

  // Filter by account first for accurate account-level running balance
  const accountScoped = transactions.filter((tx) =>
    account === 'ALL' ? true : tx.account === account
  );

  // Sort chronologically: date ASC, then createdAt ASC, then id ASC
  const sortedAll = [...accountScoped].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.createdAt !== b.createdAt) {
      return a.createdAt - b.createdAt;
    }
    return a.id.localeCompare(b.id);
  });

  let openingBalance = 0;
  const inPeriodTransactions: Transaction[] = [];

  for (const tx of sortedAll) {
    const amt = toWholeRupiah(tx.amount);
    if (startDate && tx.date < startDate) {
      openingBalance += tx.type === 'income' ? amt : -amt;
      continue;
    }
    if (endDate && tx.date > endDate) {
      continue;
    }
    inPeriodTransactions.push(tx);
  }

  let currentRunning = openingBalance;
  let totalCredit = 0;
  let totalDebit = 0;
  const rows: MutationRow[] = [];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  for (const tx of inPeriodTransactions) {
    const amt = toWholeRupiah(tx.amount);
    const nextRunning = currentRunning + (tx.type === 'income' ? amt : -amt);
    currentRunning = nextRunning;

    const matchesCategory = category === 'ALL' || tx.category === category;
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    const matchesQuery =
      normalizedQuery === '' ||
      tx.note.toLowerCase().includes(normalizedQuery) ||
      tx.category.toLowerCase().includes(normalizedQuery) ||
      tx.account.toLowerCase().includes(normalizedQuery);

    if (matchesCategory && matchesType && matchesQuery) {
      if (tx.type === 'income') {
        totalCredit += amt;
      } else {
        totalDebit += amt;
      }
      rows.push({
        ...tx,
        amount: amt,
        runningBalance: nextRunning
      });
    }
  }

  const netCashflow = totalCredit - totalDebit;
  const endingBalance =
    category === 'ALL' && typeFilter === 'ALL' && normalizedQuery === ''
      ? openingBalance + netCashflow
      : currentRunning;

  return {
    openingBalance,
    totalCredit,
    totalDebit,
    netCashflow,
    endingBalance,
    rows
  };
}

/**
 * Helper to compute difference in calendar days between two YYYY-MM-DD dates.
 */
export function diffInDays(startIso: string, endIso: string): number {
  const startParts = startIso.split('-').map(Number);
  const endParts = endIso.split('-').map(Number);
  if (startParts.length !== 3 || endParts.length !== 3) return 0;

  const startUtc = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
  const endUtc = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((endUtc - startUtc) / msPerDay);
}

/**
 * 4. Savings Goals Calculator (calculateGoalMetrics)
 * Computes completion percentage (0% to 100%), remaining shortfall,
 * remaining days/months until deadline, and recommended monthly saving amount.
 */
export function calculateGoalMetrics(
  goal: Pick<SavingsGoal, 'targetAmount' | 'currentAmount' | 'deadline'>,
  referenceDateIso: string = new Date().toISOString().slice(0, 10)
): GoalMetrics {
  const target = Math.max(1, toWholeRupiah(goal.targetAmount));
  const current = Math.max(0, toWholeRupiah(goal.currentAmount));
  const shortfall = Math.max(0, target - current);

  const rawPct = (current / target) * 100;
  const completionPercentage = Math.min(100, Math.max(0, Math.round(rawPct * 10) / 10));

  const rawDays = diffInDays(referenceDateIso, goal.deadline);
  const daysRemaining = Math.max(0, rawDays);
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));

  const recommendedMonthlySaving =
    shortfall === 0 ? 0 : Math.ceil(shortfall / monthsRemaining);

  return {
    completionPercentage,
    shortfall,
    daysRemaining,
    monthsRemaining,
    recommendedMonthlySaving,
    isCompleted: shortfall === 0,
    isOverdue: rawDays < 0 && shortfall > 0
  };
}

/**
 * 5. Time Deposit Net Yield Calculator (calculateDepositYield)
 * Given principal, interestRate (% p.a.), startDate, maturityDate, and taxRate (default 20%):
 * Computes tenure days, gross interest (principal * (interestRate / 100) * (days / 365)),
 * tax amount, net interest (Math.round(gross - tax)), total maturity payout (principal + netInterest),
 * and days remaining until maturity.
 */
export function calculateDepositYield(
  deposit: Pick<
    TimeDeposit,
    'principal' | 'interestRatePa' | 'taxRatePercent' | 'startDate' | 'maturityDate'
  >,
  referenceDateIso: string = new Date().toISOString().slice(0, 10)
): DepositYieldMetrics {
  const principal = Math.max(0, toWholeRupiah(deposit.principal));
  const tenureDays = Math.max(1, diffInDays(deposit.startDate, deposit.maturityDate));
  const rateDecimal = Math.max(0, deposit.interestRatePa) / 100;
  const taxDecimal = Math.max(0, deposit.taxRatePercent) / 100;

  const grossRaw = principal * rateDecimal * (tenureDays / 365);
  const taxRaw = grossRaw * taxDecimal;
  const grossInterest = Math.round(grossRaw);
  const taxAmount = Math.round(taxRaw);
  const netInterest = Math.round(grossRaw - taxRaw);
  const totalMaturityPayout = principal + netInterest;

  const rawRemaining = diffInDays(referenceDateIso, deposit.maturityDate);
  const daysUntilMaturity = Math.max(0, rawRemaining);

  return {
    tenureDays,
    grossInterest,
    taxAmount,
    netInterest,
    totalMaturityPayout,
    daysUntilMaturity,
    isMatured: rawRemaining <= 0
  };
}

/**
 * 6. Bill / Debt Metrics (calculateBillMetrics)
 */
export function calculateBillMetrics(
  bill: Pick<Bill, 'totalAmount' | 'installmentAmount' | 'lateFee' | 'paidAmount' | 'dueDate' | 'status'>,
  referenceDateIso: string = new Date().toISOString().slice(0, 10)
): BillMetrics {
  const principal = Math.max(0, toWholeRupiah(bill.totalAmount));
  const paid = Math.max(0, toWholeRupiah(bill.paidAmount || 0));
  const lateFee = Math.max(0, toWholeRupiah(bill.lateFee || 0));
  const remainingPrincipal = Math.max(0, principal - paid);
  const totalDueWithLateFee = Math.max(0, principal + lateFee - paid);
  const isPaid = bill.status === 'paid' || totalDueWithLateFee === 0;

  const daysRemaining = diffInDays(referenceDateIso, bill.dueDate);
  const isOverdue = !isPaid && daysRemaining < 0;

  const totalBillWithFee = principal + lateFee;
  const progressPercentage =
    totalBillWithFee > 0
      ? Math.min(100, Math.round((paid / totalBillWithFee) * 1000) / 10)
      : 100;

  const installment = Math.max(1, toWholeRupiah(bill.installmentAmount || 1));
  const estimatedPeriodsRemaining = isPaid ? 0 : Math.ceil(totalDueWithLateFee / installment);

  return {
    remainingPrincipal,
    totalDueWithLateFee,
    daysRemaining,
    isOverdue,
    isPaid,
    progressPercentage,
    estimatedPeriodsRemaining
  };
}

/**
 * 7. Bills Summary Aggregator (calculateBillsSummary)
 */
export function calculateBillsSummary(
  bills: readonly Bill[],
  referenceDateIso: string = new Date().toISOString().slice(0, 10)
): BillsSummary {
  let totalLiabilities = 0;
  let totalPrincipal = 0;
  let totalPaid = 0;
  let totalLateFee = 0;
  let activeBillsCount = 0;
  let overdueBillsCount = 0;
  let paidBillsCount = 0;
  let upcomingThisMonthAmount = 0;

  const currentYearMonth = referenceDateIso.slice(0, 7);

  for (const bill of bills) {
    const metrics = calculateBillMetrics(bill, referenceDateIso);
    totalPrincipal += toWholeRupiah(bill.totalAmount);
    totalPaid += toWholeRupiah(bill.paidAmount || 0);
    totalLateFee += toWholeRupiah(bill.lateFee || 0);

    if (metrics.isPaid) {
      paidBillsCount += 1;
    } else {
      activeBillsCount += 1;
      totalLiabilities += metrics.totalDueWithLateFee;
      if (metrics.isOverdue) {
        overdueBillsCount += 1;
      }
      // If due within current month or overdue
      if (bill.dueDate.startsWith(currentYearMonth) || metrics.isOverdue) {
        upcomingThisMonthAmount += Math.min(
          metrics.totalDueWithLateFee,
          toWholeRupiah(bill.installmentAmount) + (metrics.isOverdue ? toWholeRupiah(bill.lateFee || 0) : 0)
        );
      }
    }
  }

  return {
    totalLiabilities,
    totalPrincipal,
    totalPaid,
    totalLateFee,
    activeBillsCount,
    overdueBillsCount,
    paidBillsCount,
    upcomingThisMonthAmount
  };
}

/**
 * 8. Total Net Worth (calculateNetWorth)
 * Total Assets = Liquid Cash Balance + Total Saved in Goals + Total Principal in Active Deposits.
 * Total Liabilities = Total Remaining Bills / Debt Obligations (including late fees).
 * True Net Worth = Total Assets - Total Liabilities.
 */
export function calculateNetWorth(
  transactions: readonly Transaction[],
  goals: readonly SavingsGoal[],
  deposits: readonly TimeDeposit[],
  bills: readonly Bill[] = []
): NetWorthBreakdown {
  const liquidCashBalance = calculateLiquidBalance(transactions);
  const totalSavedInGoals = goals.reduce(
    (sum, g) => sum + toWholeRupiah(g.currentAmount),
    0
  );

  const activeDeposits = deposits.filter((d) => d.status !== 'closed');
  const totalActiveDepositsPrincipal = activeDeposits.reduce(
    (sum, d) => sum + toWholeRupiah(d.principal),
    0
  );

  const totalEstimatedNetInterest = activeDeposits.reduce((sum, d) => {
    const yieldInfo = calculateDepositYield(d);
    return sum + yieldInfo.netInterest;
  }, 0);

  const billsSummary = calculateBillsSummary(bills);
  const totalLiabilities = billsSummary.totalLiabilities;

  const totalAssets =
    liquidCashBalance + totalSavedInGoals + totalActiveDepositsPrincipal;

  const totalNetWorth = totalAssets - totalLiabilities;

  const positiveBase =
    Math.max(0, liquidCashBalance) +
    Math.max(0, totalSavedInGoals) +
    Math.max(0, totalActiveDepositsPrincipal);

  const liquidSharePercent =
    positiveBase > 0 && liquidCashBalance > 0
      ? Math.round((liquidCashBalance / positiveBase) * 1000) / 10
      : 0;
  const goalsSharePercent =
    positiveBase > 0 && totalSavedInGoals > 0
      ? Math.round((totalSavedInGoals / positiveBase) * 1000) / 10
      : 0;
  const depositsSharePercent =
    positiveBase > 0 && totalActiveDepositsPrincipal > 0
      ? Math.round((totalActiveDepositsPrincipal / positiveBase) * 1000) / 10
      : 0;

  const liabilitiesToAssetRatio =
    totalAssets > 0
      ? Math.min(100, Math.round((totalLiabilities / totalAssets) * 1000) / 10)
      : 0;

  return {
    liquidCashBalance,
    totalSavedInGoals,
    totalActiveDepositsPrincipal,
    totalEstimatedNetInterest,
    totalAssets,
    totalLiabilities,
    totalNetWorth,
    liquidSharePercent,
    goalsSharePercent,
    depositsSharePercent,
    liabilitiesToAssetRatio
  };
}
