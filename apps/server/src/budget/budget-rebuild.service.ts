import { Injectable } from '@nestjs/common';
import {
  computeCategoryBudgetsForPeriod,
  expandTransfersToAllocations,
  toBudgetRebuildCategory,
  type RebuiltCategoryBudget,
} from '@coffer/shared';
import type {
  Allocation,
  Category,
  Expense,
  Income,
  Prisma,
  Transfer,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AllocationRebuildRow = {
  category_id: string;
  amount: { toString(): string };
  period_month: Date;
  income: { status: string };
};

type TransferRebuildRow = {
  from_category_id: string;
  to_category_id: string | null;
  amount: { toString(): string };
  period_month: Date;
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
  transfers: Transfer[];
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

  /** Перевод → две знаковые allocation-строки, чтобы rebuild видел его как проектор. */
  private mapTransfersToAllocationRows(
    transfers: readonly TransferRebuildRow[],
  ) {
    return expandTransfersToAllocations(
      transfers.map((t) => ({
        from_category_id: t.from_category_id,
        to_category_id: t.to_category_id,
        amount: t.amount.toString(),
        period_month: t.period_month.toISOString(),
      })),
    ).map((row) => ({
      category_id: row.category_id,
      amount: String(row.amount),
      period_month: row.period_month,
    }));
  }

  /** Сборка входов rebuild из сырых строк — единый путь для bundle и tx-запросов. */
  private buildRebuildInputs(
    categories: readonly { id: string; type: string; carry_over_policy: string }[],
    allocations: readonly AllocationRebuildRow[],
    expenses: readonly {
      category_id: string;
      amount: { toString(): string };
      date: Date;
    }[],
    transfers: readonly TransferRebuildRow[],
  ): RebuildInputs {
    return {
      categories: this.mapCategoriesForRebuild(categories),
      allocations: [
        ...this.mapReceivedAllocations(allocations),
        ...this.mapTransfersToAllocationRows(transfers),
      ],
      expenses: expenses.map((e) => ({
        category_id: e.category_id,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
      })),
    };
  }

  toRebuildInputs(bundle: BootstrapLedgerBundle): RebuildInputs {
    return this.buildRebuildInputs(
      bundle.categories,
      bundle.allocations,
      bundle.expenses,
      bundle.transfers,
    );
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
    const transfers = await this.prisma.transfer.findMany({
      where: { user_id: userId },
    });

    return { categories, incomes, allocations, expenses, transfers };
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
    const transfers = await tx.transfer.findMany({
      where: { user_id: userId },
    });

    const inputs = this.buildRebuildInputs(
      categories,
      allocations,
      expenses,
      transfers,
    );
    return this.computeFromInputs(inputs, periodMonth);
  }
}
