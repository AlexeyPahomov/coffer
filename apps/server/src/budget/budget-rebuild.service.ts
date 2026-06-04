import { Injectable } from '@nestjs/common';
import {
  computeCategoryBudgetsForPeriod,
  toBudgetRebuildCategory,
  type RebuiltCategoryBudget,
} from '@coffer/shared';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AllocationRebuildRow = {
  category_id: string;
  amount: { toString(): string };
  period_month: Date;
  income: { status: string };
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

  async loadRebuildInputs(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { user_id: userId },
    });
    const allocations = await this.prisma.allocation.findMany({
      where: { user_id: userId },
      include: { income: true },
    });
    const expenses = await this.prisma.expense.findMany({
      where: { user_id: userId },
    });

    return {
      categories: this.mapCategoriesForRebuild(categories),
      allocations: this.mapReceivedAllocations(allocations),
      expenses: expenses.map((e) => ({
        category_id: e.category_id,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
      })),
    };
  }

  async computeForPeriod(
    userId: string,
    periodMonth: string,
  ): Promise<RebuiltCategoryBudget[]> {
    const inputs = await this.loadRebuildInputs(userId);
    return computeCategoryBudgetsForPeriod(
      inputs.categories,
      inputs.allocations,
      inputs.expenses,
      periodMonth,
    );
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
