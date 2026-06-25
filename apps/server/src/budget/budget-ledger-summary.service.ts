import { Injectable } from '@nestjs/common';
import {
  computePeriodLedgerSummary,
  type PeriodLedgerIncome,
} from '@coffer/shared';

import { PrismaService } from '../prisma/prisma.service';

import { mapPrismaIncomesToPeriodLedger } from './budget-ledger.mappers';
import {
  BudgetRebuildService,
  type RebuildInputs,
} from './budget-rebuild.service';
import type { PeriodLedgerSummaryDto } from './budget-ledger-summary.view.dto';

@Injectable()
export class BudgetLedgerSummaryService {
  constructor(
    private readonly rebuildService: BudgetRebuildService,
    private readonly prisma: PrismaService,
  ) {}

  computeFromInputs(
    ledgerInputs: RebuildInputs,
    incomes: PeriodLedgerIncome[],
    periodMonth: string,
  ): PeriodLedgerSummaryDto {
    return computePeriodLedgerSummary({
      categories: ledgerInputs.categories,
      allocations: ledgerInputs.allocations,
      expenses: ledgerInputs.expenses,
      incomes,
      periodMonth,
    });
  }

  async computeForPeriod(
    userId: string,
    periodMonth: string,
  ): Promise<PeriodLedgerSummaryDto> {
    const [ledgerInputs, incomes] = await Promise.all([
      this.rebuildService.loadRebuildInputs(userId),
      this.prisma.income.findMany({ where: { user_id: userId } }),
    ]);

    return this.computeFromInputs(
      ledgerInputs,
      mapPrismaIncomesToPeriodLedger(incomes),
      periodMonth,
    );
  }
}
