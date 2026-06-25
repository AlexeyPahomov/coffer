import { Injectable } from '@nestjs/common';
import {
  computeCategoryBudgetsForPeriod,
  toBudgetRebuildCategory,
  type RebuiltCategoryBudget,
} from '@coffer/shared';
import type {
  Allocation,
  Category,
  Expense,
  Income,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AllocationRebuildRow = {
  category_id: string;
  amount: { toString(): string };
  period_month: Date;
  income: { status: string };
};

type RebuildCategory = ReturnType<typeof toBudgetRebuildCategory>;

export type RebuildInputs = {
  categories: RebuildCategory[];
  allocations: {
    category_id: string;
    amount: string;
    period_month: string;
  }[];
  expenses: {
    category_id: string;
    amount: string;
    date: string;
  }[];
};

export type BootstrapLedgerBundle = {
  categories: Category[];
  incomes: Income[];
  allocations: (Allocation & { income: Income })[];
  expenses: Expense[];
};

@Injectable()
export class BudgetRebuildService {
  constructor(private readonly prisma: PrismaService) {}

  private mapReceivedAllocations(allocations: readonly AllocationRebuildRow[]) {
    return allocations
      .filter((a) => a.income.status === 'RECEIVED')
      .map((a) => ({
        category_id: a.category_id,
        amount: a.amount.toString(),
        period_month: a.period_month.toISOString(),
      }));
  }

  private mapCategoriesForRebuild<
    T extends { id: string; type: string; carry_over_policy: string },
  >(categories: readonly T[]) {
    return categories.map(toBudgetRebuildCategory);
  }

  toRebuildInputs(bundle: BootstrapLedgerBundle): RebuildInputs {
    return {
      categories: this.mapCategoriesForRebuild(bundle.categories),
      allocations: this.mapReceivedAllocations(bundle.allocations),
      expenses: bundle.expenses.map((e) => ({
        category_id: e.category_id,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
      })),
    };
  }

  async loadBootstrapLedgerBundle(
    userId: string,
  ): Promise<BootstrapLedgerBundle> {
    const categories = await this.prisma.category.findMany({
      where: { user_id: userId },
    });
    const incomes = await this.prisma.income.findMany({
      where: { user_id: userId },
    });
    const allocations = await this.prisma.allocation.findMany({
      where: { user_id: userId },
      include: { income: true },
    });
    const expenses = await this.prisma.expense.findMany({
      where: { user_id: userId },
    });

    return { categories, incomes, allocations, expenses };
  }

  async loadRebuildInputs(userId: string): Promise<RebuildInputs> {
    const bundle = await this.loadBootstrapLedgerBundle(userId);
    return this.toRebuildInputs(bundle);
  }

  computeFromInputs(
    inputs: RebuildInputs,
    periodMonth: string,
  ): RebuiltCategoryBudget[] {
    return computeCategoryBudgetsForPeriod(
      inputs.categories,
      inputs.allocations,
      inputs.expenses,
      periodMonth,
    );
  }

  async computeForPeriod(
    userId: string,
    periodMonth: string,
  ): Promise<RebuiltCategoryBudget[]> {
    const inputs = await this.loadRebuildInputs(userId);
    return this.computeFromInputs(inputs, periodMonth);
  }

  async computeForPeriodInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    periodMonth: string,
  ): Promise<RebuiltCategoryBudget[]> {
    const categories = await tx.category.findMany({
      where: { user_id: userId },
    });
    const allocations = await tx.allocation.findMany({
      where: { user_id: userId },
      include: { income: true },
    });
    const expenses = await tx.expense.findMany({
      where: { user_id: userId },
    });

    return computeCategoryBudgetsForPeriod(
      this.mapCategoriesForRebuild(categories),
      this.mapReceivedAllocations(allocations),
      expenses.map((e) => ({
        category_id: e.category_id,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
      })),
      periodMonth,
    );
  }
}
