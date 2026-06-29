import { Injectable, NotFoundException } from '@nestjs/common';
import {
  computeCategoryBudgetsForCycle,
  filterAllocationsExcludingClosedPeriods,
  filterExpensesExcludingClosedPeriods,
  filterIncomesExcludingClosedPeriods,
  formatPeriodMonthKeyFromDate,
  formatReceivedAtFromDate,
  resolveActiveIncomeCycle,
  resolveBudgetAsOfKey,
  toBudgetRebuildCategory,
} from '@coffer/shared';
import type { RebuiltCycleCategoryBudget } from '@coffer/shared';
import type {
  Allocation,
  Category,
  Expense,
  Income,
} from '../generated/prisma/client';
import { toMoneyNumber } from '../lib/money';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BudgetCycleIncomeDto,
  BudgetCycleViewDto,
} from './budget-cycle.view.dto';
import type { CategorySnapshotDto } from './budget-month.view.dto';
import type { BootstrapLedgerBundle } from './budget-rebuild.service';

@Injectable()
export class BudgetCycleService {
  constructor(private readonly prisma: PrismaService) {}

  async getClosedPeriodMonths(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.budgetMonth.findMany({
      where: { user_id: userId, status: 'CLOSED' },
      select: { year: true, month: true },
    });

    return new Set(
      rows.map((row) => `${row.year}-${String(row.month).padStart(2, '0')}`),
    );
  }

  private mapSnapshot(
    category: {
      id: string;
      name: string;
      type: string;
      icon: string;
    },
    row: {
      categoryId: string;
      openingBalance: number;
      allocated: number;
      spent: number;
      closingBalance: number;
    },
  ): CategorySnapshotDto {
    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryType: category.type,
      categoryIcon: category.icon,
      openingBalance: row.openingBalance,
      allocated: row.allocated,
      spent: row.spent,
      closingBalance: row.closingBalance,
    };
  }

  private mapReceivedAllocations(
    allocations: (Allocation & { income: Income })[],
    closedPeriodMonths: Set<string>,
  ) {
    return filterAllocationsExcludingClosedPeriods(
      allocations
        .filter((allocation) => allocation.income.status === 'RECEIVED')
        .filter((allocation) => allocation.income.received_at != null)
        .map((allocation) => ({
          category_id: allocation.category_id,
          income_id: allocation.income_id,
          income_received_at: formatReceivedAtFromDate(
            allocation.income.received_at!,
          ),
          income_period_month: formatPeriodMonthKeyFromDate(
            allocation.income.period_month,
          ),
          allocation_period_month: formatPeriodMonthKeyFromDate(
            allocation.period_month,
          ),
          amount: allocation.amount.toString(),
        })),
      closedPeriodMonths,
    );
  }

  private mapActiveIncomes(incomes: Income[], closedPeriodMonths: Set<string>) {
    return filterIncomesExcludingClosedPeriods(
      incomes.map((income) => ({
        id: income.id,
        status: String(income.status),
        received_at: income.received_at
          ? formatReceivedAtFromDate(income.received_at)
          : null,
        period_month: formatPeriodMonthKeyFromDate(income.period_month),
        income_type: String(income.income_type),
      })),
      closedPeriodMonths,
    );
  }

  private mapExpenseRows(expenses: Expense[], closedPeriodMonths: Set<string>) {
    return filterExpensesExcludingClosedPeriods(
      expenses.map((expense) => ({
        category_id: expense.category_id,
        amount: expense.amount.toString(),
        date: formatReceivedAtFromDate(expense.date),
      })),
      closedPeriodMonths,
    );
  }

  private buildSnapshots(
    rebuilt: readonly RebuiltCycleCategoryBudget[],
    categories: Category[],
  ): CategorySnapshotDto[] {
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    return rebuilt
      .map((row) => {
        const category = categoryById.get(row.categoryId);
        if (!category) {
          return null;
        }
        return this.mapSnapshot(category, row);
      })
      .filter((row): row is CategorySnapshotDto => row != null)
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }

  private buildCurrentView(
    asOf: string,
    closedPeriodMonths: Set<string>,
    incomes: Income[],
    categories: Category[],
    allocations: (Allocation & { income: Income })[],
    expenses: Expense[],
  ): BudgetCycleViewDto {
    const receivedAllocations = this.mapReceivedAllocations(
      allocations,
      closedPeriodMonths,
    );
    const activeIncomes = this.mapActiveIncomes(incomes, closedPeriodMonths);

    const cycle = resolveActiveIncomeCycle(
      activeIncomes,
      asOf,
      receivedAllocations,
      closedPeriodMonths,
    );

    if (!cycle) {
      throw new NotFoundException('No active income cycle for this date');
    }

    const activeIncome = incomes.find((income) => income.id === cycle.incomeId);
    if (!activeIncome?.received_at) {
      throw new NotFoundException('Active income has no received_at');
    }

    const expenseRows = this.mapExpenseRows(expenses, closedPeriodMonths);

    const rebuilt = computeCategoryBudgetsForCycle(
      categories.map(toBudgetRebuildCategory),
      receivedAllocations,
      expenseRows,
      cycle,
      asOf,
      closedPeriodMonths,
      activeIncomes,
    );

    const snapshots = this.buildSnapshots(rebuilt, categories);

    const incomeDto: BudgetCycleIncomeDto = {
      id: activeIncome.id,
      amount: toMoneyNumber(activeIncome.amount.toString()),
      source: activeIncome.source,
      incomeType: activeIncome.income_type,
      periodMonth: formatPeriodMonthKeyFromDate(activeIncome.period_month),
      receivedAt: formatReceivedAtFromDate(activeIncome.received_at),
    };

    return {
      asOf,
      cycleStart: cycle.cycleStart,
      cycleEnd: cycle.cycleEnd,
      income: incomeDto,
      snapshots,
    };
  }

  getCurrentViewFromInputs(
    asOfParam: string | undefined,
    closedPeriodMonths: Set<string>,
    ledger: BootstrapLedgerBundle,
  ): BudgetCycleViewDto {
    const asOf = resolveBudgetAsOfKey(asOfParam);
    return this.buildCurrentView(
      asOf,
      closedPeriodMonths,
      ledger.incomes,
      ledger.categories,
      ledger.allocations,
      ledger.expenses,
    );
  }

  async getCurrentView(
    userId: string,
    asOfParam?: string,
  ): Promise<BudgetCycleViewDto> {
    const asOf = resolveBudgetAsOfKey(asOfParam);

    const closedPeriodMonths = await this.getClosedPeriodMonths(userId);

    const [incomes, categories, allocations, expenses] = await Promise.all([
      this.prisma.income.findMany({
        where: { user_id: userId },
        orderBy: { received_at: 'asc' },
      }),
      this.prisma.category.findMany({
        where: { user_id: userId },
      }),
      this.prisma.allocation.findMany({
        where: { user_id: userId },
        include: { income: true },
      }),
      this.prisma.expense.findMany({
        where: { user_id: userId },
      }),
    ]);

    return this.buildCurrentView(
      asOf,
      closedPeriodMonths,
      incomes,
      categories,
      allocations,
      expenses,
    );
  }
}
