import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { BudgetProjectorService } from './budget-projector.service';

/**
 * Юнит-тесты дельта-проекции: проектор читает снапшот, прибавляет дельту и
 * пересчитывает closing ТОЛЬКО через computeClosing (никогда `closing += delta`).
 * `db` — параметр метода, поэтому мокается напрямую без NestJS DI.
 */
describe('BudgetProjectorService', () => {
  let projector: BudgetProjectorService;
  let requireOpenMonth: jest.Mock;
  let snapshot: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
  let budgetMonth: { findUnique: jest.Mock };
  let db: {
    categoryMonthSnapshot: typeof snapshot;
    budgetMonth: typeof budgetMonth;
  };

  const snapshotState = (over: {
    id: string;
    opening_balance?: number;
    allocated?: number;
    spent?: number;
  }) => ({
    opening_balance: 0,
    allocated: 0,
    spent: 0,
    ...over,
  });

  beforeEach(() => {
    requireOpenMonth = jest.fn();
    snapshot = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };
    budgetMonth = { findUnique: jest.fn() };
    db = { categoryMonthSnapshot: snapshot, budgetMonth };

    projector = new BudgetProjectorService({
      requireOpenMonth,
    } as never);
  });

  const expense = {
    user_id: 'user-1',
    category_id: 'food',
    amount: { toString: () => '3000' },
    date: new Date('2026-06-10T00:00:00.000Z'),
  };

  it('onExpenseCreated adds the amount to spent and recomputes closing', async () => {
    requireOpenMonth.mockResolvedValue({ id: 'bm-1' });
    snapshot.findUnique
      .mockResolvedValueOnce({ id: 'snap-1' }) // resolveSnapshotId: уже есть
      .mockResolvedValueOnce(
        snapshotState({
          id: 'snap-1',
          opening_balance: 10_000,
          allocated: 20_000,
          spent: 5_000,
        }),
      );

    await projector.onExpenseCreated(db as never, expense);

    // closing = computeClosing(10000, 20000, 5000 + 3000) = 22000
    expect(snapshot.update).toHaveBeenCalledWith({
      where: { id: 'snap-1' },
      data: {
        allocated: 20_000,
        spent: 8_000,
        closing_balance: 22_000,
        version: { increment: 1 },
      },
    });
  });

  it('onExpenseCreated materializes a zero snapshot when none exists', async () => {
    requireOpenMonth.mockResolvedValue({ id: 'bm-1' });
    snapshot.findUnique
      .mockResolvedValueOnce(null) // resolveSnapshotId: нет снапшота
      .mockResolvedValueOnce(snapshotState({ id: 'snap-new' }));
    snapshot.create.mockResolvedValue({ id: 'snap-new' });

    await projector.onExpenseCreated(db as never, expense);

    expect(snapshot.create).toHaveBeenCalledWith({
      data: {
        budget_month_id: 'bm-1',
        category_id: 'food',
        user_id: 'user-1',
        year: 2026,
        month: 6,
        opening_balance: 0,
        allocated: 0,
        spent: 0,
        closing_balance: 0,
      },
    });
    // closing = computeClosing(0, 0, 3000) = -3000
    expect(snapshot.update).toHaveBeenCalledWith({
      where: { id: 'snap-new' },
      data: {
        allocated: 0,
        spent: 3_000,
        closing_balance: -3_000,
        version: { increment: 1 },
      },
    });
  });

  it('onExpenseRemoved is a no-op when the month is closed', async () => {
    budgetMonth.findUnique.mockResolvedValue({ id: 'bm-1', status: 'CLOSED' });

    await projector.onExpenseRemoved(db as never, expense);

    expect(snapshot.update).not.toHaveBeenCalled();
  });

  it('onExpenseRemoved subtracts the amount when the month is open', async () => {
    budgetMonth.findUnique.mockResolvedValue({ id: 'bm-1', status: 'OPEN' });
    snapshot.findUnique
      .mockResolvedValueOnce({ id: 'snap-1' }) // поиск по budget_month_id+category_id
      .mockResolvedValueOnce(
        snapshotState({
          id: 'snap-1',
          allocated: 10_000,
          spent: 5_000,
        }),
      );

    await projector.onExpenseRemoved(db as never, expense);

    // closing = computeClosing(0, 10000, 5000 - 3000) = 8000
    expect(snapshot.update).toHaveBeenCalledWith({
      where: { id: 'snap-1' },
      data: {
        allocated: 10_000,
        spent: 2_000,
        closing_balance: 8_000,
        version: { increment: 1 },
      },
    });
  });

  it('onAllocationCreated adds the amount to allocated', async () => {
    requireOpenMonth.mockResolvedValue({ id: 'bm-1' });
    snapshot.findUnique
      .mockResolvedValueOnce({ id: 'snap-1' })
      .mockResolvedValueOnce(
        snapshotState({ id: 'snap-1', allocated: 10_000 }),
      );

    await projector.onAllocationCreated(db as never, {
      user_id: 'user-1',
      category_id: 'food',
      amount: { toString: () => '5000' },
      period_month: new Date('2026-06-01T00:00:00.000Z'),
    });

    // closing = computeClosing(0, 10000 + 5000, 0) = 15000
    expect(snapshot.update).toHaveBeenCalledWith({
      where: { id: 'snap-1' },
      data: {
        allocated: 15_000,
        spent: 0,
        closing_balance: 15_000,
        version: { increment: 1 },
      },
    });
  });
});
