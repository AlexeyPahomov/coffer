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
  let service: BudgetMonthService;
  let prisma: {
    budgetMonth: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    categoryMonthSnapshot: {
      findMany: jest.Mock;
      createMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    category: { findMany: jest.Mock };
    income: { findMany: jest.Mock };
    plannedExpense: { aggregate: jest.Mock };
    $transaction: jest.Mock;
  };
  let rebuildService: {
    computeForPeriod: jest.Mock;
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
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      categoryMonthSnapshot: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      category: { findMany: jest.fn() },
      income: { findMany: jest.fn() },
      plannedExpense: { aggregate: jest.fn() },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (cb: (client: typeof tx) => Promise<unknown>) => cb(tx),
    );
    rebuildService = {
      computeForPeriod: jest.fn(),
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
});
