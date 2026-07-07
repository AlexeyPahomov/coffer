import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { BudgetMonthService } from './budget-month.service';

/**
 * Юнит-тесты двух критических путей проекций: фиксация месяца (close — агрегат
 * MonthCloseReport + перевод в CLOSED) и детерминированная пересборка
 * (rebuildFrom — замена снапшотов открытых месяцев от периода вперёд).
 * Prisma и rebuild-сервис мокаются; цель — характеризовать собственную логику
 * сервиса, а не БД.
 */
describe('BudgetMonthService', () => {
  type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  let service: BudgetMonthService;
  let prisma: {
    budgetMonth: {
      findUnique: AsyncMock;
      findMany: AsyncMock;
      findFirst: AsyncMock;
    };
    categoryMonthSnapshot: {
      findMany: AsyncMock;
      createMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    category: { findMany: AsyncMock };
    income: { findMany: AsyncMock };
    plannedExpense: { aggregate: AsyncMock };
    $transaction: jest.Mock;
  };
  let rebuildService: {
    computeForPeriod: AsyncMock;
  };
  let tx: {
    monthCloseReport: { deleteMany: jest.Mock; create: jest.Mock };
    budgetMonth: { update: jest.Mock };
  };

  beforeEach(() => {
    tx = {
      monthCloseReport: { deleteMany: jest.fn(), create: jest.fn() },
      budgetMonth: { update: jest.fn() },
    };
    prisma = {
      budgetMonth: {
        findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        findFirst: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      categoryMonthSnapshot: {
        findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      category: {
        findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      income: { findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>() },
      plannedExpense: {
        aggregate: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (cb: (client: typeof tx) => Promise<unknown>) => cb(tx),
    );
    rebuildService = {
      computeForPeriod: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };

    service = new BudgetMonthService(prisma as never, rebuildService as never);
  });

  describe('close', () => {
    it('writes the close report totals and marks the month CLOSED', async () => {
      const month = {
        id: 'bm-1',
        user_id: 'user-1',
        year: 2026,
        month: 6,
        status: 'OPEN',
      };
      prisma.budgetMonth.findUnique.mockResolvedValue(month);
      prisma.budgetMonth.findMany.mockResolvedValue([]); // rebuildFrom покрыт отдельно
      prisma.categoryMonthSnapshot.findMany.mockResolvedValue([
        {
          id: 's1',
          budget_month_id: 'bm-1',
          category_id: 'food',
          opening_balance: 0,
          allocated: 20_000,
          spent: 5_000,
          closing_balance: 15_000,
        },
        {
          id: 's2',
          budget_month_id: 'bm-1',
          category_id: 'fun',
          opening_balance: 0,
          allocated: 5_000,
          spent: 7_000,
          closing_balance: -2_000,
        },
      ]);
      prisma.category.findMany.mockResolvedValue([
        { id: 'food', name: 'Food', type: 'expense', icon: 'utensils' },
        { id: 'fun', name: 'Fun', type: 'expense', icon: 'gamepad' },
      ]);
      prisma.income.findMany.mockResolvedValue([{ amount: 100_000 }]);
      prisma.plannedExpense.aggregate.mockResolvedValue({
        _sum: { reserved_amount: 3_000 },
      });

      await service.close('user-1', '2026-06');

      // spent = 5000 + 7000; carryForward = +15000; overspent = |−2000|
      expect(tx.monthCloseReport.create).toHaveBeenCalledWith({
        data: {
          budget_month_id: 'bm-1',
          income_total: 100_000,
          spent_total: 12_000,
          reserved_total: 3_000,
          overspent_total: 2_000,
          carry_forward_total: 15_000,
        },
      });
      expect(tx.budgetMonth.update).toHaveBeenCalledWith({
        where: { id: 'bm-1' },
        data: { status: 'CLOSED', closed_at: expect.any(Date) },
      });
    });

    it('is a no-op when the month is already CLOSED', async () => {
      const month = {
        id: 'bm-1',
        user_id: 'user-1',
        year: 2026,
        month: 6,
        status: 'CLOSED',
      };
      prisma.budgetMonth.findUnique.mockResolvedValue(month);
      prisma.budgetMonth.findMany.mockResolvedValue([]);
      prisma.categoryMonthSnapshot.findMany.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);

      await service.close('user-1', '2026-06');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('rebuildFrom', () => {
    it('recomputes and replaces snapshots for each open month from the period forward', async () => {
      prisma.budgetMonth.findMany.mockResolvedValue([
        { id: 'bm-6', year: 2026, month: 6 },
        { id: 'bm-7', year: 2026, month: 7 },
      ]);
      rebuildService.computeForPeriod
        .mockResolvedValueOnce([
          {
            categoryId: 'food',
            openingBalance: 0,
            allocated: 20_000,
            spent: 5_000,
            closingBalance: 15_000,
          },
        ])
        .mockResolvedValueOnce([]); // июль: пусто → createMany не вызывается

      await service.rebuildFrom('user-1', '2026-06');

      expect(rebuildService.computeForPeriod).toHaveBeenNthCalledWith(
        1,
        'user-1',
        '2026-06',
      );
      expect(rebuildService.computeForPeriod).toHaveBeenNthCalledWith(
        2,
        'user-1',
        '2026-07',
      );
      expect(prisma.categoryMonthSnapshot.deleteMany).toHaveBeenCalledWith({
        where: { budget_month_id: 'bm-6' },
      });
      expect(prisma.categoryMonthSnapshot.deleteMany).toHaveBeenCalledWith({
        where: { budget_month_id: 'bm-7' },
      });
      expect(prisma.categoryMonthSnapshot.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.categoryMonthSnapshot.createMany).toHaveBeenCalledWith({
        data: [
          {
            budget_month_id: 'bm-6',
            category_id: 'food',
            user_id: 'user-1',
            year: 2026,
            month: 6,
            opening_balance: 0,
            allocated: 20_000,
            spent: 5_000,
            closing_balance: 15_000,
          },
        ],
      });
    });
  });

  describe('reopen', () => {
    const closedJune = {
      id: 'bm-6',
      user_id: 'user-1',
      year: 2026,
      month: 6,
      status: 'CLOSED',
    };

    it('flips CLOSED → OPEN, drops the close report and rebuilds forward', async () => {
      prisma.budgetMonth.findUnique.mockResolvedValue(closedJune);
      prisma.budgetMonth.findFirst.mockResolvedValue(null); // нет более позднего CLOSED
      prisma.budgetMonth.findMany.mockResolvedValue([]); // rebuildFrom покрыт отдельно
      prisma.categoryMonthSnapshot.findMany.mockResolvedValue([]); // для финального getView

      await service.reopen('user-1', '2026-06');

      expect(tx.monthCloseReport.deleteMany).toHaveBeenCalledWith({
        where: { budget_month_id: 'bm-6' },
      });
      expect(tx.budgetMonth.update).toHaveBeenCalledWith({
        where: { id: 'bm-6' },
        data: { status: 'OPEN', closed_at: null },
      });
      // rebuildFrom запущен (ищет OPEN-месяцы от периода вперёд)
      expect(prisma.budgetMonth.findMany).toHaveBeenCalled();
    });

    it('rejects when a later month is still CLOSED', async () => {
      prisma.budgetMonth.findUnique.mockResolvedValue(closedJune);
      prisma.budgetMonth.findFirst.mockResolvedValue({
        id: 'bm-7',
        year: 2026,
        month: 7,
        status: 'CLOSED',
      });

      await expect(service.reopen('user-1', '2026-06')).rejects.toThrow(
        'Reopen later months first',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('is a no-op when the month is already OPEN', async () => {
      prisma.budgetMonth.findUnique.mockResolvedValue({
        ...closedJune,
        status: 'OPEN',
      });
      prisma.categoryMonthSnapshot.findMany.mockResolvedValue([]);

      await service.reopen('user-1', '2026-06');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.budgetMonth.findFirst).not.toHaveBeenCalled();
    });

    it('throws when the month does not exist', async () => {
      prisma.budgetMonth.findUnique.mockResolvedValue(null);

      await expect(service.reopen('user-1', '2026-06')).rejects.toThrow(
        'Budget month not found',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
