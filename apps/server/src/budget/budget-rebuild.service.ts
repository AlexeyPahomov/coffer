import { Injectable } from '@nestjs/common';
import {
  computeCategoryBudgetsForPeriod,
  type RebuiltCategoryBudget,
} from '@coffer/shared';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetRebuildService {
  constructor(private readonly prisma: PrismaService) {}

  async loadRebuildInputs(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { user_id: userId },
    });
    const allocations = await this.prisma.allocation.findMany({
      where: { user_id: userId },
    });
    const expenses = await this.prisma.expense.findMany({
      where: { user_id: userId },
    });

    return {
      categories: categories.map((c) => ({ id: c.id, type: c.type })),
      allocations: allocations.map((a) => ({
        category_id: a.category_id,
        amount: a.amount.toString(),
        period_month: a.period_month.toISOString(),
      })),
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
    });
    const expenses = await tx.expense.findMany({
      where: { user_id: userId },
    });

    return computeCategoryBudgetsForPeriod(
      categories.map((c) => ({ id: c.id, type: c.type })),
      allocations.map((a) => ({
        category_id: a.category_id,
        amount: a.amount.toString(),
        period_month: a.period_month.toISOString(),
      })),
      expenses.map((e) => ({
        category_id: e.category_id,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
      })),
      periodMonth,
    );
  }
}
