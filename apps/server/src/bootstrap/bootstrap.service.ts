import { Injectable, NotFoundException } from '@nestjs/common';

import { AllocationRuleService } from '../allocation-rule/allocation-rule.service';
import { BudgetCycleService } from '../budget/budget-cycle.service';
import { BudgetLedgerSummaryService } from '../budget/budget-ledger-summary.service';
import { BudgetMonthService } from '../budget/budget-month.service';
import { CategoryService } from '../category/category.service';
import { IncomeService } from '../income/income.service';
import { withTransientDbRetry } from '../prisma/db-retry';
import { PlannedExpenseService } from '../planned-expense/planned-expense.service';

import type { AppBootstrapDto } from './bootstrap.view.dto';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly incomeService: IncomeService,
    private readonly plannedExpenseService: PlannedExpenseService,
    private readonly allocationRuleService: AllocationRuleService,
    private readonly budgetCycleService: BudgetCycleService,
    private readonly budgetMonthService: BudgetMonthService,
    private readonly budgetLedgerSummaryService: BudgetLedgerSummaryService,
  ) {}

  async getBootstrap(
    userId: string,
    periodMonth: string,
    asOf: string,
  ): Promise<AppBootstrapDto> {
    return withTransientDbRetry(async () => {
      const [
        categories,
        incomes,
        plannedExpenses,
        allocationRules,
        periodLedgerSummary,
      ] = await Promise.all([
        this.categoryService.findAll(),
        this.incomeService.findAll(),
        this.plannedExpenseService.findAll(),
        this.allocationRuleService.findAll(),
        this.budgetLedgerSummaryService.computeForPeriod(userId, periodMonth),
      ]);

      let budgetCycle: AppBootstrapDto['budgetCycle'] = null;
      try {
        budgetCycle = await this.budgetCycleService.getCurrentView(userId, asOf);
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }

      const budgetMonth = await this.budgetMonthService.getViewOrOpen(
        userId,
        periodMonth,
      );

      return {
        periodMonth,
        asOf,
        categories,
        incomes,
        plannedExpenses,
        allocationRules,
        budgetCycle,
        budgetMonth,
        periodLedgerSummary,
      };
    });
  }
}
