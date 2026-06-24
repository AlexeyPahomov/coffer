import type { BudgetCycleViewDto } from '../budget/budget-cycle.view.dto';
import type { BudgetMonthViewDto } from '../budget/budget-month.view.dto';

/** Ответ `GET /bootstrap` — начальный срез данных приложения. */
export type AppBootstrapDto = {
  periodMonth: string;
  asOf: string;
  categories: Awaited<
    ReturnType<import('../category/category.service').CategoryService['findAll']>
  >;
  incomes: Awaited<
    ReturnType<import('../income/income.service').IncomeService['findAll']>
  >;
  allocations: Awaited<
    ReturnType<import('../allocation/allocation.service').AllocationService['findAll']>
  >;
  expenses: Awaited<
    ReturnType<import('../expense/expense.service').ExpenseService['findAll']>
  >;
  plannedExpenses: Awaited<
    ReturnType<
      import('../planned-expense/planned-expense.service').PlannedExpenseService['findAll']
    >
  >;
  allocationRules: Awaited<
    ReturnType<
      import('../allocation-rule/allocation-rule.service').AllocationRuleService['findAll']
    >
  >;
  budgetCycle: BudgetCycleViewDto | null;
  budgetMonth: BudgetMonthViewDto;
};
