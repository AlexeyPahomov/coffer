import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { PrismaService } from '../prisma/prisma.service';
import { AllocationService } from './allocation.service';

describe('AllocationService', () => {
  let service: AllocationService;
  type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  let prisma: {
    income: { findUnique: AsyncMock };
    allocation: {
      findMany: AsyncMock;
      findFirst: AsyncMock;
      create: AsyncMock;
      update: AsyncMock;
    };
    category: { findUnique: AsyncMock };
  };

  beforeEach(async () => {
    prisma = {
      income: { findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>() },
      allocation: {
        findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        findFirst: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      category: { findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllocationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: BudgetMonthService,
          useValue: {
            ensurePeriodOpen: jest.fn(),
          },
        },
        {
          provide: BudgetProjectorService,
          useValue: {
            onAllocationCreated: jest.fn(),
            onAllocationUpdated: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AllocationService>(AllocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects updating allocation for expected income', async () => {
    prisma.allocation.findFirst.mockResolvedValue({
      id: 'allocation-1',
      income_id: 'income-1',
      category_id: 'category-1',
      amount: 1000,
      period_month: new Date('2026-06-01'),
    });
    prisma.income.findUnique.mockResolvedValue({
      id: 'income-1',
      amount: 1000,
      status: 'EXPECTED',
      period_month: new Date('2026-06-01'),
    });

    await expect(
      service.update('allocation-1', 'user-1', {
        category_id: 'category-1',
        amount: 1000,
      }),
    ).rejects.toThrow('Expected income cannot be allocated');

    expect(prisma.category.findUnique).not.toHaveBeenCalled();
    expect(prisma.allocation.update).not.toHaveBeenCalled();
  });
});
