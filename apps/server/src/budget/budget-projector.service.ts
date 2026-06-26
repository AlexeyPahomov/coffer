import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  computeClosing,
  monthValueFromDate,
  parsePeriodMonthKey,
} from '@coffer/shared';
import { toMoneyNumber } from '../lib/money';
import type { BudgetDbClient } from './budget-db';
import { BudgetMonthService } from './budget-month.service';

@Injectable()
export class BudgetProjectorService {
  constructor(private readonly budgetMonthService: BudgetMonthService) {}

  private periodFromExpenseDate(date: Date): string {
    return monthValueFromDate(date);
  }

  /** Обновление snapshot (отдельные запросы — без интерактивной $transaction на pooler). */
  private async applySnapshotDeltas(
    db: BudgetDbClient,
    snapshotId: string,
    allocatedDelta: number,
    spentDelta: number,
  ): Promise<void> {
    const snap = await db.categoryMonthSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snap) {
      throw new NotFoundException('Category month snapshot not found');
    }

    const opening = toMoneyNumber(snap.opening_balance.toString());
    const allocated = toMoneyNumber(snap.allocated.toString()) + allocatedDelta;
    const spent = toMoneyNumber(snap.spent.toString()) + spentDelta;
    const closing_balance = computeClosing(opening, allocated, spent);

    await db.categoryMonthSnapshot.update({
      where: { id: snapshotId },
      data: {
        allocated,
        spent,
        closing_balance,
        version: { increment: 1 },
      },
    });
  }

  private async resolveSnapshotId(
    db: BudgetDbClient,
    userId: string,
    periodMonth: string,
    categoryId: string,
  ): Promise<string> {
    const budgetMonth = await this.budgetMonthService.requireOpenMonth(
      db,
      userId,
      periodMonth,
    );

    const parsed = parsePeriodMonthKey(periodMonth);
    if (!parsed) {
      throw new ConflictException('Invalid period month');
    }

    const existing = await db.categoryMonthSnapshot.findUnique({
      where: {
        budget_month_id_category_id: {
          budget_month_id: budgetMonth.id,
          category_id: categoryId,
        },
      },
    });

    if (existing) {
      return existing.id;
    }

    const created = await db.categoryMonthSnapshot.create({
      data: {
        budget_month_id: budgetMonth.id,
        category_id: categoryId,
        user_id: userId,
        year: parsed.year,
        month: parsed.month,
        opening_balance: 0,
        allocated: 0,
        spent: 0,
        closing_balance: 0,
      },
    });

    return created.id;
  }

  async onExpenseCreated(
    db: BudgetDbClient,
    expense: {
      user_id: string;
      category_id: string;
      amount: { toString(): string };
      date: Date;
    },
  ): Promise<void> {
    const periodMonth = this.periodFromExpenseDate(expense.date);
    const snapshotId = await this.resolveSnapshotId(
      db,
      expense.user_id,
      periodMonth,
      expense.category_id,
    );
    await this.applySnapshotDeltas(
      db,
      snapshotId,
      0,
      toMoneyNumber(expense.amount.toString()),
    );
  }

  async onExpenseUpdated(
    db: BudgetDbClient,
    before: {
      user_id: string;
      category_id: string;
      amount: { toString(): string };
      date: Date;
    },
    after: {
      category_id: string;
      amount: { toString(): string };
      date: Date;
    },
  ): Promise<void> {
    await this.onExpenseRemoved(db, before);
    await this.onExpenseCreated(db, {
      user_id: before.user_id,
      category_id: after.category_id,
      amount: after.amount,
      date: after.date,
    });
  }

  async onExpenseRemoved(
    db: BudgetDbClient,
    expense: {
      user_id: string;
      category_id: string;
      amount: { toString(): string };
      date: Date;
    },
  ): Promise<void> {
    const periodMonth = this.periodFromExpenseDate(expense.date);
    const parsed = parsePeriodMonthKey(periodMonth);
    if (!parsed) {
      return;
    }

    const budgetMonth = await db.budgetMonth.findUnique({
      where: {
        user_id_year_month: {
          user_id: expense.user_id,
          year: parsed.year,
          month: parsed.month,
        },
      },
    });

    if (!budgetMonth || budgetMonth.status !== 'OPEN') {
      return;
    }

    const snapshot = await db.categoryMonthSnapshot.findUnique({
      where: {
        budget_month_id_category_id: {
          budget_month_id: budgetMonth.id,
          category_id: expense.category_id,
        },
      },
    });

    if (!snapshot) {
      return;
    }

    await this.applySnapshotDeltas(
      db,
      snapshot.id,
      0,
      -toMoneyNumber(expense.amount.toString()),
    );
  }

  async onAllocationCreated(
    db: BudgetDbClient,
    allocation: {
      user_id: string;
      category_id: string;
      amount: { toString(): string };
      period_month: Date;
    },
  ): Promise<void> {
    const periodMonth = monthValueFromDate(allocation.period_month);
    const snapshotId = await this.resolveSnapshotId(
      db,
      allocation.user_id,
      periodMonth,
      allocation.category_id,
    );
    await this.applySnapshotDeltas(
      db,
      snapshotId,
      toMoneyNumber(allocation.amount.toString()),
      0,
    );
  }

  async onAllocationRemoved(
    db: BudgetDbClient,
    allocation: {
      user_id: string;
      category_id: string;
      amount: { toString(): string };
      period_month: Date;
    },
  ): Promise<void> {
    const periodMonth = monthValueFromDate(allocation.period_month);
    const snapshotId = await this.resolveSnapshotId(
      db,
      allocation.user_id,
      periodMonth,
      allocation.category_id,
    );
    await this.applySnapshotDeltas(
      db,
      snapshotId,
      -toMoneyNumber(allocation.amount.toString()),
      0,
    );
  }

  async onAllocationUpdated(
    db: BudgetDbClient,
    before: {
      user_id: string;
      category_id: string;
      amount: { toString(): string };
      period_month: Date;
    },
    after: {
      user_id: string;
      category_id: string;
      amount: { toString(): string };
      period_month: Date;
    },
  ): Promise<void> {
    await this.onAllocationRemoved(db, before);
    await this.onAllocationCreated(db, after);
  }
}
