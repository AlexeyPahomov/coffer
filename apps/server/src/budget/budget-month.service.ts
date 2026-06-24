import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  type BudgetMonth,
} from '../generated/prisma/client';
import { isOverspent } from '@coffer/shared';
import { toMoneyNumber } from '../lib/money';
import {
  parsePeriodMonthKey,
  type ParsedPeriodMonth,
} from '../lib/period-month';
import { withTransientDbRetry } from '../prisma/db-retry';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetRebuildService } from './budget-rebuild.service';
import type { BudgetDbClient } from './budget-db';
import type {
  BudgetMonthMeta,
  BudgetMonthWithSnapshots,
  CategorySnapshotRow,
} from './budget-month.types';
import type {
  BudgetMonthViewDto,
  CategorySnapshotDto,
} from './budget-month.view.dto';
import type { RebuiltCategoryBudget } from '@coffer/shared';

export type {
  BudgetMonthViewDto,
  CategorySnapshotDto,
} from './budget-month.view.dto';

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class BudgetMonthService {
  /** Один in-flight `open` на user+period (клиент часто шлёт параллельные POST). */
  private readonly materializeLocks = new Map<string, Promise<void>>();

  private readonly prisma: PrismaClient;

  constructor(
    prismaService: PrismaService,
    private readonly rebuildService: BudgetRebuildService,
  ) {
    this.prisma = prismaService;
  }

  private materializeLockKey(userId: string, periodMonth: string): string {
    return `${userId}:${periodMonth}`;
  }

  private mapSnapshot(row: CategorySnapshotRow): CategorySnapshotDto {
    return {
      categoryId: row.category_id,
      categoryName: row.category.name,
      categoryType: row.category.type,
      categoryIcon: row.category.icon,
      openingBalance: toMoneyNumber(row.opening_balance.toString()),
      allocated: toMoneyNumber(row.allocated.toString()),
      spent: toMoneyNumber(row.spent.toString()),
      closingBalance: toMoneyNumber(row.closing_balance.toString()),
    };
  }

  private parsePeriodOrThrow(periodMonth: string): ParsedPeriodMonth {
    const parsed = parsePeriodMonthKey(periodMonth);
    if (parsed === null) {
      throw new ConflictException('Invalid period month');
    }
    return parsed;
  }

  private async findBudgetMonthMeta(
    userId: string,
    periodMonth: string,
  ): Promise<BudgetMonthMeta | null> {
    const parsed = this.parsePeriodOrThrow(periodMonth);

    return await this.prisma.budgetMonth.findUnique({
      where: {
        user_id_year_month: {
          user_id: userId,
          year: parsed.year,
          month: parsed.month,
        },
      },
    });
  }

  /** Открыть месяц до короткой транзакции мутации (expense / allocation). */
  async ensurePeriodOpen(userId: string, periodMonth: string): Promise<void> {
    const meta = await this.findBudgetMonthMeta(userId, periodMonth);
    if (!meta) {
      await this.open(userId, periodMonth);
      return;
    }
    if (meta.status === 'CLOSED') {
      throw new ConflictException('Budget month is closed');
    }
  }

  private async findBudgetMonthRow(
    userId: string,
    periodMonth: string,
  ): Promise<BudgetMonthWithSnapshots | null> {
    const parsed = this.parsePeriodOrThrow(periodMonth);

    const month = await this.prisma.budgetMonth.findUnique({
      where: {
        user_id_year_month: {
          user_id: userId,
          year: parsed.year,
          month: parsed.month,
        },
      },
    });

    if (!month) {
      return null;
    }

    const snapshots = await this.prisma.categoryMonthSnapshot.findMany({
      where: { budget_month_id: month.id },
    });

    const categoryIds = [...new Set(snapshots.map((snap) => snap.category_id))];
    const categories =
      categoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
          })
        : [];
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    const snapshotsWithCategory = snapshots
      .map((snap) => {
        const category = categoryById.get(snap.category_id);
        if (!category) {
          throw new NotFoundException('Category not found');
        }
        return { ...snap, category };
      })
      .sort((a, b) => a.category.name.localeCompare(b.category.name));

    return { ...month, snapshots: snapshotsWithCategory };
  }

  async getView(
    userId: string,
    periodMonth: string,
  ): Promise<BudgetMonthViewDto> {
    return withTransientDbRetry(async () => {
      const row = await this.findBudgetMonthRow(userId, periodMonth);
      if (!row) {
        throw new NotFoundException('Budget month not found');
      }

      const parsed = this.parsePeriodOrThrow(periodMonth);

      return {
        periodMonth,
        year: parsed.year,
        month: parsed.month,
        status: row.status,
        snapshots: row.snapshots.map((snap) => this.mapSnapshot(snap)),
      };
    });
  }

  /** GET view или materialize + view (без отдельного POST open на клиенте). */
  async getViewOrOpen(
    userId: string,
    periodMonth: string,
  ): Promise<BudgetMonthViewDto> {
    return this.open(userId, periodMonth);
  }

  async open(userId: string, periodMonth: string): Promise<BudgetMonthViewDto> {
    const meta = await this.findBudgetMonthMeta(userId, periodMonth);
    if (meta) {
      return this.getView(userId, periodMonth);
    }

    const lockKey = this.materializeLockKey(userId, periodMonth);
    let pending = this.materializeLocks.get(lockKey);
    if (!pending) {
      pending = this.materializeMonth(userId, periodMonth).finally(() => {
        this.materializeLocks.delete(lockKey);
      });
      this.materializeLocks.set(lockKey, pending);
    }
    await pending;

    return this.getView(userId, periodMonth);
  }

  /** Месяц должен быть открыт заранее через `ensurePeriodOpen` / `POST open`. */
  async requireOpenMonth(
    db: BudgetDbClient,
    userId: string,
    periodMonth: string,
  ): Promise<BudgetMonth> {
    const parsed = this.parsePeriodOrThrow(periodMonth);

    const existing = await db.budgetMonth.findUnique({
      where: {
        user_id_year_month: {
          user_id: userId,
          year: parsed.year,
          month: parsed.month,
        },
      },
    });

    if (!existing) {
      throw new ConflictException(
        'Budget month is not open for this period. Open the month first.',
      );
    }

    if (existing.status === 'CLOSED') {
      throw new ConflictException('Budget month is closed');
    }

    return existing;
  }

  private snapshotRowsForCreate(
    budgetMonthId: string,
    userId: string,
    parsed: ParsedPeriodMonth,
    rebuilt: readonly RebuiltCategoryBudget[],
  ) {
    return rebuilt.map((row) => ({
      budget_month_id: budgetMonthId,
      category_id: row.categoryId,
      user_id: userId,
      year: parsed.year,
      month: parsed.month,
      opening_balance: row.openingBalance,
      allocated: row.allocated,
      spent: row.spent,
      closing_balance: row.closingBalance,
    }));
  }

  private async materializeMonth(
    userId: string,
    periodMonth: string,
  ): Promise<void> {
    const parsed = this.parsePeriodOrThrow(periodMonth);

    if (await this.findBudgetMonthMeta(userId, periodMonth)) {
      return;
    }

    const rebuilt = await this.rebuildService.computeForPeriod(
      userId,
      periodMonth,
    );

    let budgetMonthId: string | null = null;

    try {
      const budgetMonth = await this.prisma.budgetMonth.create({
        data: {
          user_id: userId,
          year: parsed.year,
          month: parsed.month,
          status: 'OPEN',
        },
      });
      budgetMonthId = budgetMonth.id;

      if (rebuilt.length > 0) {
        await this.prisma.categoryMonthSnapshot.createMany({
          data: this.snapshotRowsForCreate(
            budgetMonth.id,
            userId,
            parsed,
            rebuilt,
          ),
        });
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return;
      }

      if (budgetMonthId) {
        await this.prisma.budgetMonth
          .delete({ where: { id: budgetMonthId } })
          .catch(() => undefined);
      }

      throw error;
    }
  }

  /** Закрыть учётный месяц: снимок конвертов фиксируется, месяц исключается из активного цикла. */
  async close(userId: string, periodMonth: string): Promise<BudgetMonthViewDto> {
    await this.open(userId, periodMonth);
    await this.rebuildFrom(userId, periodMonth);

    const parsed = this.parsePeriodOrThrow(periodMonth);
    const row = await this.findBudgetMonthRow(userId, periodMonth);
    if (!row) {
      throw new NotFoundException('Budget month not found');
    }

    if (row.status === 'CLOSED') {
      return this.getView(userId, periodMonth);
    }

    const periodStart = new Date(parsed.year, parsed.month - 1, 1);
    const periodEnd = new Date(parsed.year, parsed.month, 1);

    const periodIncomes = await this.prisma.income.findMany({
      where: {
        user_id: userId,
        status: 'RECEIVED',
        period_month: { gte: periodStart, lt: periodEnd },
      },
    });

    const incomeTotal = periodIncomes.reduce(
      (sum, income) => sum + toMoneyNumber(income.amount.toString()),
      0,
    );

    let spentTotal = 0;
    let carryForwardTotal = 0;
    let overspentTotal = 0;

    for (const snap of row.snapshots) {
      const spent = toMoneyNumber(snap.spent.toString());
      const closing = toMoneyNumber(snap.closing_balance.toString());
      spentTotal += spent;
      if (closing > 0) {
        carryForwardTotal += closing;
      } else if (isOverspent(closing)) {
        overspentTotal += Math.abs(closing);
      }
    }

    const reservedTotal = await this.prisma.plannedExpense.aggregate({
      where: {
        user_id: userId,
        budget_month_id: row.id,
        status: 'RESERVED',
      },
      _sum: { reserved_amount: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.monthCloseReport.deleteMany({
        where: { budget_month_id: row.id },
      });

      await tx.monthCloseReport.create({
        data: {
          budget_month_id: row.id,
          income_total: incomeTotal,
          spent_total: spentTotal,
          reserved_total: toMoneyNumber(
            reservedTotal._sum.reserved_amount?.toString() ?? '0',
          ),
          overspent_total: overspentTotal,
          carry_forward_total: carryForwardTotal,
        },
      });

      await tx.budgetMonth.update({
        where: { id: row.id },
        data: {
          status: 'CLOSED',
          closed_at: new Date(),
        },
      });
    });

    return this.getView(userId, periodMonth);
  }

  /** Детерминированный rebuild OPEN месяца и всех последующих (для reopen / repair). */
  async rebuildFrom(userId: string, fromPeriodMonth: string): Promise<void> {
    const parsed = this.parsePeriodOrThrow(fromPeriodMonth);

    const openMonths = await this.prisma.budgetMonth.findMany({
      where: {
        user_id: userId,
        status: 'OPEN',
        OR: [
          { year: { gt: parsed.year } },
          { year: parsed.year, month: { gte: parsed.month } },
        ],
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    for (const monthRow of openMonths) {
      const period = `${monthRow.year}-${String(monthRow.month).padStart(2, '0')}`;
      const rebuilt = await this.rebuildService.computeForPeriod(
        userId,
        period,
      );

      await this.prisma.categoryMonthSnapshot.deleteMany({
        where: { budget_month_id: monthRow.id },
      });

      if (rebuilt.length > 0) {
        await this.prisma.categoryMonthSnapshot.createMany({
          data: this.snapshotRowsForCreate(
            monthRow.id,
            userId,
            {
              year: monthRow.year,
              month: monthRow.month,
            },
            rebuilt,
          ),
        });
      }
    }
  }
}
