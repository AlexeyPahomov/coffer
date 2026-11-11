import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransferService } from '../transfer/transfer.service';
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
        { provide: TransferService, useValue: { remove: jest.fn() } },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('ExpenseService.remove — расход проведённого плана', () => {
  it('возвращает перевод из накоплений и план в резерв', async () => {
    const transferRemove = jest.fn(() => Promise.resolve({}));
    const planUpdate = jest.fn(() => Promise.resolve({}));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: PrismaService,
          useValue: {
            expense: {
              findFirst: jest.fn(() =>
                Promise.resolve({ id: 'expense-1', category_id: 'trip' }),
              ),
              delete: jest.fn(() => Promise.resolve({})),
            },
            plannedExpense: {
              findFirst: jest.fn(() =>
                Promise.resolve({
                  id: 'plan-1',
                  amount: '100000',
                  completed_transfer_id: 'transfer-1',
                }),
              ),
              update: planUpdate,
            },
          },
        },
        { provide: BudgetMonthService, useValue: {} },
        {
          provide: BudgetProjectorService,
          useValue: { onExpenseRemoved: jest.fn(() => Promise.resolve()) },
        },
        { provide: TransferService, useValue: { remove: transferRemove } },
      ],
    }).compile();

    await module.get(ExpenseService).remove('expense-1', 'user-1');

    expect(transferRemove).toHaveBeenCalledWith('transfer-1', 'user-1');
    expect(planUpdate).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: expect.objectContaining({
        status: 'RESERVED',
        completed_transfer_id: null,
      }) as unknown,
    });
  });
});
