import { Injectable } from '@nestjs/common';
import {
  computePeriodLedgerSummary,
  type PeriodLedgerIncome,
} from '@coffer/shared';

import { PrismaService } from '../prisma/prisma.service';

import { BudgetRebuildService } from './budget-rebuild.service';
import type { PeriodLedgerSummaryDto } from './budget-ledger-summary.view.dto';

@Injectable()
export class BudgetLedgerSummaryService {
  constructor(
    private readonly rebuildService: BudgetRebuildService,
    private readonly prisma: PrismaService,
  ) {}

  private async loadIncomesForSummary(
    userId: string,
  ): Promise<PeriodLedgerIncome[]> {
    const incomes = await this.prisma.income.findMany({
      where: { user_id: userId },
    });

    return incomes.map((income) => ({
      amount: income.amount.toString(),
      period_month: income.period_month.toISOString(),
      status: income.status,
    }));
  }

  async computeForPeriod(
    userId: string,
    periodMonth: string,
  ): Promise<PeriodLedgerSummaryDto> {
    const [ledgerInputs, incomes] = await Promise.all([
      this.rebuildService.loadRebuildInputs(userId),
      this.loadIncomesForSummary(userId),
    ]);

    return computePeriodLedgerSummary({
      categories: ledgerInputs.categories,
      allocations: ledgerInputs.allocations,
      expenses: ledgerInputs.expenses,
      incomes,
      periodMonth,
    });
  }
}
