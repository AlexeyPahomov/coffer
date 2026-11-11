import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransferService } from '../transfer/transfer.service';
import { PlannedExpenseService } from './planned-expense.service';

describe('PlannedExpenseService — доля из накоплений', () => {
  let service: PlannedExpenseService;
  type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  const asyncMock = () => jest.fn<(...args: unknown[]) => Promise<unknown>>();
  let prisma: {
    category: { findUnique: AsyncMock; findMany: AsyncMock };
    budgetMonth: { findUnique: AsyncMock; findMany: AsyncMock };
    plannedExpense: {
      create: AsyncMock;
      findFirst: AsyncMock;
      findMany: AsyncMock;
      update: AsyncMock;
    };
    expense: { create: AsyncMock; delete: AsyncMock };
  };
  let transferCreate: AsyncMock;
  let transferRemove: AsyncMock;

  const budgetMonth = { id: 'bm-1', year: 2026, month: 7, status: 'OPEN' };
  const categories: Record<string, { id: string; type: string }> = {
    trip: { id: 'trip', type: 'expense' },
    savings: { id: 'savings', type: 'savings' },
  };

  const createDto = {
    title: 'Поездка',
    amount: 100_000,
    planned_date: '2026-07-10',
    category_id: 'trip',
    savings_category_id: 'savings',
    savings_amount: 30_000,
  };

  beforeEach(async () => {
    prisma = {
      category: { findUnique: asyncMock(), findMany: asyncMock() },
      budgetMonth: { findUnique: asyncMock(), findMany: asyncMock() },
      plannedExpense: {
        create: asyncMock(),
        findFirst: asyncMock(),
        findMany: asyncMock(),
        update: asyncMock(),
      },
      expense: { create: asyncMock(), delete: asyncMock() },
    };
    prisma.category.findUnique.mockImplementation((args) => {
      const id = (args as { where: { id: string } }).where.id;
      return Promise.resolve(categories[id] ?? null);
    });
    prisma.category.findMany.mockResolvedValue([]);
    prisma.budgetMonth.findUnique.mockResolvedValue(budgetMonth);
    prisma.budgetMonth.findMany.mockResolvedValue([budgetMonth]);
    prisma.plannedExpense.create.mockImplementation((args) =>
      Promise.resolve({ id: 'plan-1', ...(args as { data: object }).data }),
    );
    prisma.expense.create.mockResolvedValue({ id: 'expense-1' });
    prisma.plannedExpense.update.mockResolvedValue({ id: 'plan-1' });
    transferCreate = asyncMock();
    transferCreate.mockResolvedValue({ id: 'transfer-1' });
    transferRemove = asyncMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannedExpenseService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: BudgetMonthService,
          useValue: { ensurePeriodOpen: asyncMock() },
        },
        {
          provide: BudgetProjectorService,
          useValue: { onExpenseCreated: asyncMock() },
        },
        {
          provide: TransferService,
          useValue: { create: transferCreate, remove: transferRemove },
        },
      ],
    }).compile();

    service = module.get(PlannedExpenseService);
  });

  it('сохраняет разбивку при создании', async () => {
    await service.create('user-1', createDto);

    expect(prisma.plannedExpense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        savings_category_id: 'savings',
        savings_amount: 30_000,
      }) as unknown,
    });
  });

  it('отклоняет долю больше суммы плана', async () => {
    await expect(
      service.create('user-1', { ...createDto, savings_amount: 150_000 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('отклоняет источник, который не конверт накоплений', async () => {
    await expect(
      service.create('user-1', {
        ...createDto,
        category_id: undefined,
        savings_category_id: 'trip',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('при проведении переводит долю из накоплений в конверт расхода', async () => {
    prisma.plannedExpense.findFirst.mockResolvedValue({
      id: 'plan-1',
      status: 'RESERVED',
      reserved_amount: '100000',
      category_id: 'trip',
      savings_category_id: 'savings',
      savings_amount: '30000',
      budget_month_id: 'bm-1',
      description: null,
    });

    await service.finish('plan-1', 'user-1', {
      amount: 20_000,
      date: '2026-07-12',
    });

    // Доля не больше фактической суммы расхода.
    expect(transferCreate).toHaveBeenCalledWith('user-1', {
      from_category_id: 'savings',
      to_category_id: 'trip',
      amount: 20_000,
      period_month: '2026-07-01',
    });
    expect(prisma.plannedExpense.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: expect.objectContaining({
        completed_transfer_id: 'transfer-1',
      }) as unknown,
    });
  });

  const completedPlan = {
    id: 'plan-1',
    status: 'COMPLETED',
    amount: '100000',
    reserved_amount: '0',
    category_id: 'trip',
    savings_category_id: 'savings',
    savings_amount: '30000',
    budget_month_id: 'bm-1',
    completed_expense_id: null,
    completed_transfer_id: 'transfer-1',
  };

  it('расход удалён вручную — возвращает перевод из накоплений и план в резерв', async () => {
    prisma.plannedExpense.findMany.mockResolvedValue([{ ...completedPlan }]);
    transferRemove.mockResolvedValue({ id: 'transfer-1' });

    await service.findAll('user-1');
    await new Promise((resolve) => setImmediate(resolve));

    expect(transferRemove).toHaveBeenCalledWith('transfer-1', 'user-1');
    expect(prisma.plannedExpense.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: expect.objectContaining({
        status: 'RESERVED',
        completed_transfer_id: null,
      }) as unknown,
    });
  });

  it('сбой создания расхода откатывает перевод из накоплений', async () => {
    prisma.plannedExpense.findFirst.mockResolvedValue({
      ...completedPlan,
      status: 'RESERVED',
      reserved_amount: '100000',
      completed_transfer_id: null,
      description: null,
    });
    prisma.expense.create.mockRejectedValue(new Error('pooler timeout'));
    transferRemove.mockResolvedValue({ id: 'transfer-1' });

    await expect(
      service.finish('plan-1', 'user-1', {
        amount: 100_000,
        date: '2026-07-12',
      }),
    ).rejects.toThrow('pooler timeout');
    expect(transferRemove).toHaveBeenCalledWith('transfer-1', 'user-1');
  });

  it('смена статуса не проверяет разбивку с удалённым конвертом накоплений', async () => {
    prisma.plannedExpense.findFirst.mockResolvedValue({
      ...completedPlan,
      status: 'PLANNED',
      savings_category_id: null,
      planned_date: new Date('2026-07-10'),
      planned_date_end: null,
    });

    await service.update('plan-1', 'user-1', { status: 'RESERVED' });

    expect(prisma.plannedExpense.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: expect.objectContaining({ status: 'RESERVED' }) as unknown,
    });
  });

  const reservedPlan = {
    ...completedPlan,
    status: 'RESERVED',
    reserved_amount: '100000',
    completed_transfer_id: null,
    description: null,
  };

  it('сбой обновления плана удаляет и созданный расход, и перевод', async () => {
    prisma.plannedExpense.findFirst.mockResolvedValue(reservedPlan);
    prisma.plannedExpense.update.mockRejectedValue(new Error('pooler timeout'));
    prisma.expense.delete.mockResolvedValue({ id: 'expense-1' });
    transferRemove.mockResolvedValue({ id: 'transfer-1' });

    await expect(
      service.finish('plan-1', 'user-1', {
        amount: 100_000,
        date: '2026-07-12',
      }),
    ).rejects.toThrow('pooler timeout');
    expect(prisma.expense.delete).toHaveBeenCalledWith({
      where: { id: 'expense-1' },
    });
    expect(transferRemove).toHaveBeenCalledWith('transfer-1', 'user-1');
  });

  it('расход в сам конверт накоплений проводится без перевода', async () => {
    prisma.plannedExpense.findFirst.mockResolvedValue(reservedPlan);

    await service.finish('plan-1', 'user-1', {
      category_id: 'savings',
      amount: 100_000,
      date: '2026-07-12',
    });

    expect(transferCreate).not.toHaveBeenCalled();
  });

  it('у проведённого плана разбивку менять нельзя', async () => {
    prisma.plannedExpense.findFirst.mockResolvedValue({
      ...completedPlan,
      planned_date: new Date('2026-07-10'),
      planned_date_end: null,
    });

    await expect(
      service.update('plan-1', 'user-1', { savings_amount: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
