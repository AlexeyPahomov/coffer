import { Injectable, NotFoundException } from '@nestjs/common';

import { AllocationRuleService } from '../allocation-rule/allocation-rule.service';
import { AllocationService } from '../allocation/allocation.service';
import { BudgetCycleService } from '../budget/budget-cycle.service';
import { BudgetMonthService } from '../budget/budget-month.service';
import { CategoryService } from '../category/category.service';
import { ExpenseService } from '../expense/expense.service';
import { IncomeService } from '../income/income.service';
import { withTransientDbRetry } from '../prisma/db-retry';
import { PlannedExpenseService } from '../planned-expense/planned-expense.service';

import type { AppBootstrapDto } from './bootstrap.view.dto';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly incomeService: IncomeService,
    private readonly allocationService: AllocationService,
    private readonly expenseService: ExpenseService,
    private readonly plannedExpenseService: PlannedExpenseService,
    private readonly allocationRuleService: AllocationRuleService,
    private readonly budgetCycleService: BudgetCycleService,
    private readonly budgetMonthService: BudgetMonthService,
  ) {}

  async getBootstrap(
    userId: string,
    periodMonth: string,
    asOf: string,
  ): Promise<AppBootstrapDto> {
    return withTransientDbRetry(async () => {
      const categories = await this.categoryService.findAll();
      const incomes = await this.incomeService.findAll();
      const allocations = await this.allocationService.findAll();
      const expenses = await this.expenseService.findAll();
      const plannedExpenses = await this.plannedExpenseService.findAll();
      const allocationRules = await this.allocationRuleService.findAll();

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
        allocations,
        expenses,
        plannedExpenses,
        allocationRules,
        budgetCycle,
        budgetMonth,
      };
    });
  }
}
