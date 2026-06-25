import { Injectable, NotFoundException } from '@nestjs/common';

import { AllocationRuleService } from '../allocation-rule/allocation-rule.service';
import {
  mapPrismaIncomesToPeriodLedger,
  sortByCreatedAtDesc,
} from '../budget/budget-ledger.mappers';
import { BudgetCycleService } from '../budget/budget-cycle.service';
import { BudgetLedgerSummaryService } from '../budget/budget-ledger-summary.service';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetRebuildService } from '../budget/budget-rebuild.service';
import { withTransientDbRetry } from '../prisma/db-retry';
import { PlannedExpenseService } from '../planned-expense/planned-expense.service';

import type { AppBootstrapDto } from './bootstrap.view.dto';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly plannedExpenseService: PlannedExpenseService,
    private readonly allocationRuleService: AllocationRuleService,
    private readonly budgetCycleService: BudgetCycleService,
    private readonly budgetMonthService: BudgetMonthService,
    private readonly budgetLedgerSummaryService: BudgetLedgerSummaryService,
    private readonly rebuildService: BudgetRebuildService,
  ) {}

  async getBootstrap(
    userId: string,
    periodMonth: string,
    asOf: string,
  ): Promise<AppBootstrapDto> {
    return withTransientDbRetry(async () => {
      const ledgerBundle =
        await this.rebuildService.loadBootstrapLedgerBundle(userId);

      const plannedExpenses = await this.plannedExpenseService.findAll();
      const allocationRules = await this.allocationRuleService.findAll();
      const closedPeriodMonths =
        await this.budgetCycleService.getClosedPeriodMonths(userId);
      const budgetMonthMeta = await this.budgetMonthService.getBudgetMonthMeta(
        userId,
        periodMonth,
      );

      const rebuildInputs = this.rebuildService.toRebuildInputs(ledgerBundle);
      const periodLedgerIncomes = mapPrismaIncomesToPeriodLedger(
        ledgerBundle.incomes,
      );

      let budgetCycle: AppBootstrapDto['budgetCycle'] = null;
      try {
        budgetCycle = this.budgetCycleService.getCurrentViewFromInputs(
          asOf,
          closedPeriodMonths,
          ledgerBundle,
        );
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }

      const periodLedgerSummary =
        this.budgetLedgerSummaryService.computeFromInputs(
          rebuildInputs,
          periodLedgerIncomes,
          periodMonth,
        );

      const budgetMonth = await this.budgetMonthService.getViewOrOpenFromInputs(
        userId,
        periodMonth,
        rebuildInputs,
        {
          monthMeta: budgetMonthMeta,
          categories: ledgerBundle.categories,
        },
      );

      return {
        periodMonth,
        asOf,
        categories: sortByCreatedAtDesc(ledgerBundle.categories),
        incomes: sortByCreatedAtDesc(ledgerBundle.incomes),
        plannedExpenses,
        allocationRules,
        budgetCycle,
        budgetMonth,
        periodLedgerSummary,
      };
    });
  }
}
