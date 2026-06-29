import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: PrismaService,
          useValue: {
            category: { findUnique: jest.fn() },
            allocation: { findMany: jest.fn() },
            expense: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: BudgetMonthService,
          useValue: { ensurePeriodOpen: jest.fn() },
        },
        {
          provide: BudgetProjectorService,
          useValue: {
            onExpenseCreated: jest.fn(),
            onExpenseUpdated: jest.fn(),
            onExpenseRemoved: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
