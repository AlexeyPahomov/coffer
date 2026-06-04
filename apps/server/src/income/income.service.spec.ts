import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetMonthService } from '../budget/budget-month.service';
import { PrismaService } from '../prisma/prisma.service';
import { IncomeService } from './income.service';

describe('IncomeService', () => {
  let service: IncomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        {
          provide: PrismaService,
          useValue: {
            income: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            allocation: {
              count: jest.fn(),
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(
              async (fn: (tx: unknown) => Promise<unknown>) => {
                const tx = {
                  allocation: {
                    deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
                  },
                  income: {
                    delete: jest.fn(() => Promise.resolve({})),
                  },
                };
                return fn(tx);
              },
            ),
          },
        },
        {
          provide: BudgetMonthService,
          useValue: {
            rebuildFrom: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IncomeService>(IncomeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
