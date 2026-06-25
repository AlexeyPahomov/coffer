import type { PeriodLedgerIncome } from '@coffer/shared';

import type { Income } from '../generated/prisma/client';

export function mapPrismaIncomesToPeriodLedger(
  incomes: readonly Income[],
): PeriodLedgerIncome[] {
  return incomes.map((income) => ({
    amount: income.amount.toString(),
    period_month: income.period_month.toISOString(),
    status: income.status,
  }));
}

export function sortByCreatedAtDesc<T extends { created_at: Date }>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) => b.created_at.getTime() - a.created_at.getTime(),
  );
}
