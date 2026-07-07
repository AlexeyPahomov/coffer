import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetCycleService } from './budget-cycle.service';

describe('BudgetCycleService', () => {
  let service: BudgetCycleService;

  const groceriesCategory = {
    id: 'groceries',
    user_id: 'user-1',
    name: 'Продукты',
    type: 'expense',
    icon: 'utensils',
    icon_color: 'purple',
    carry_over_policy: 'RESET',
    created_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetCycleService,
        {
          provide: PrismaService,
          useValue: {
            budgetMonth: {
              findMany: jest
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue([]),
            },
            income: {
              findMany: jest
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue([]),
            },
            category: {
              findMany: jest
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue([]),
            },
            allocation: {
              findMany: jest
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue([]),
            },
            expense: {
              findMany: jest
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue([]),
            },
            transfer: {
              findMany: jest
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue([]),
            },
          },
        },
      ],
    }).compile();

    service = module.get(BudgetCycleService);
  });

  it('returns grocery balance across May advance cycle into early June', async () => {
    const prisma = service['prisma'] as unknown as {
      income: { findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>> };
      category: {
        findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
      };
      allocation: {
        findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
      };
      expense: {
        findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
      };
    };

    prisma.income.findMany.mockResolvedValue([
      {
        id: 'may-settlement',
        user_id: 'user-1',
        amount: { toString: () => '150000' },
        source: 'Зарплата',
        income_type: 'salary',
        status: 'RECEIVED',
        period_month: new Date('2026-05-01'),
        received_at: new Date('2026-05-05'),
        created_at: new Date('2026-05-05'),
      },
      {
        id: 'may-advance',
        user_id: 'user-1',
        amount: { toString: () => '200000' },
        source: 'Зарплата',
        income_type: 'salary',
        status: 'RECEIVED',
        period_month: new Date('2026-05-01'),
        received_at: new Date('2026-05-22'),
        created_at: new Date('2026-05-22'),
      },
      {
        id: 'may-extra',
        user_id: 'user-1',
        amount: { toString: () => '5000' },
        source: 'Зарплата',
        income_type: 'salary',
        status: 'RECEIVED',
        period_month: new Date('2026-05-01'),
        received_at: new Date('2026-05-25'),
        created_at: new Date('2026-05-25'),
      },
      {
        id: 'june-settlement',
        user_id: 'user-1',
        amount: { toString: () => '150000' },
        source: 'Зарплата',
        income_type: 'salary',
        status: 'RECEIVED',
        period_month: new Date('2026-06-01'),
        received_at: new Date('2026-06-05'),
        created_at: new Date('2026-06-05'),
      },
    ]);
    prisma.category.findMany.mockResolvedValue([groceriesCategory]);
    prisma.allocation.findMany.mockResolvedValue([
      {
        category_id: 'groceries',
        income_id: 'may-advance',
        amount: { toString: () => '72000' },
        period_month: new Date('2026-05-01'),
        income: {
          status: 'RECEIVED',
          received_at: new Date('2026-05-22'),
          period_month: new Date('2026-05-01'),
        },
      },
    ]);
    prisma.expense.findMany.mockResolvedValue([
      {
        category_id: 'groceries',
        amount: { toString: () => '34000' },
        date: new Date('2026-05-30'),
      },
      {
        category_id: 'groceries',
        amount: { toString: () => '8000' },
        date: new Date('2026-06-04'),
      },
    ]);

    const view = await service.getCurrentView('user-1', '2026-06-04');
    const groceries = view.snapshots.find((s) => s.categoryId === 'groceries');

    expect(view.income.id).toBe('may-advance');
    expect(view.cycleStart).toBe('2026-05-22');
    expect(view.cycleEnd).toBe('2026-06-05');
    expect(groceries?.allocated).toBe(72_000);
    expect(groceries?.spent).toBe(42_000);
    expect(groceries?.closingBalance).toBe(30_000);
  });

  it('reflects a transfer in the active cycle envelopes', async () => {
    const prisma = service['prisma'] as unknown as {
      income: { findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>> };
      category: {
        findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
      };
      allocation: {
        findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
      };
      expense: {
        findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
      };
      transfer: {
        findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
      };
    };

    const funCategory = {
      ...groceriesCategory,
      id: 'fun',
      name: 'Развлечения',
    };

    prisma.income.findMany.mockResolvedValue([
      {
        id: 'may-advance',
        user_id: 'user-1',
        amount: { toString: () => '200000' },
        source: 'Зарплата',
        income_type: 'salary',
        status: 'RECEIVED',
        period_month: new Date('2026-05-01'),
        received_at: new Date('2026-05-22'),
        created_at: new Date('2026-05-22'),
      },
    ]);
    prisma.category.findMany.mockResolvedValue([
      groceriesCategory,
      funCategory,
    ]);
    prisma.allocation.findMany.mockResolvedValue([
      {
        category_id: 'groceries',
        income_id: 'may-advance',
        amount: { toString: () => '5000' },
        period_month: new Date('2026-05-01'),
        income: {
          status: 'RECEIVED',
          received_at: new Date('2026-05-22'),
          period_month: new Date('2026-05-01'),
        },
      },
      {
        category_id: 'fun',
        income_id: 'may-advance',
        amount: { toString: () => '1000' },
        period_month: new Date('2026-05-01'),
        income: {
          status: 'RECEIVED',
          received_at: new Date('2026-05-22'),
          period_month: new Date('2026-05-01'),
        },
      },
    ]);
    prisma.expense.findMany.mockResolvedValue([]);
    prisma.transfer.findMany.mockResolvedValue([
      {
        from_category_id: 'groceries',
        to_category_id: 'fun',
        amount: { toString: () => '2000' },
        period_month: new Date('2026-05-01'),
        created_at: new Date('2026-05-25'),
      },
    ]);

    const view = await service.getCurrentView('user-1', '2026-05-30');
    const groceries = view.snapshots.find((s) => s.categoryId === 'groceries');
    const fun = view.snapshots.find((s) => s.categoryId === 'fun');

    expect(groceries?.closingBalance).toBe(3_000); // 5000 − 2000
    expect(fun?.closingBalance).toBe(3_000); // 1000 + 2000
  });

  it('throws when no received income exists before asOf', async () => {
    const prisma = service['prisma'] as unknown as {
      income: { findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>> };
    };
    prisma.income.findMany.mockResolvedValue([]);

    await expect(
      service.getCurrentView('user-1', '2026-06-04'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
