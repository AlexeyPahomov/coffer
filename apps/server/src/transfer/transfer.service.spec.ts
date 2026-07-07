import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransferService } from './transfer.service';

describe('TransferService', () => {
  let service: TransferService;
  type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  let prisma: {
    category: { findUnique: AsyncMock };
    categoryMonthSnapshot: { findUnique: AsyncMock };
    transfer: { create: AsyncMock; findFirst: AsyncMock; delete: AsyncMock };
  };
  let requireOpenMonth: AsyncMock;
  let onTransferCreated: jest.Mock;

  const dto = {
    from_category_id: 'savings',
    to_category_id: 'repair',
    amount: 1_000,
    period_month: '2026-06-01',
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      categoryMonthSnapshot: {
        findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      transfer: {
        create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        findFirst: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
        delete: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
    };
    requireOpenMonth = jest.fn<(...args: unknown[]) => Promise<unknown>>();
    onTransferCreated = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: PrismaService, useValue: prisma },
        { provide: BudgetMonthService, useValue: { requireOpenMonth } },
        {
          provide: BudgetProjectorService,
          useValue: { onTransferCreated, onTransferRemoved: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  it('rejects a transfer to the same category', async () => {
    await expect(
      service.create('user-1', { ...dto, to_category_id: 'savings' }),
    ).rejects.toThrow('Source and target categories must differ');
    expect(prisma.transfer.create).not.toHaveBeenCalled();
  });

  it('rejects a non-positive amount', async () => {
    await expect(
      service.create('user-1', { ...dto, amount: 0 }),
    ).rejects.toThrow('Transfer amount must be positive');
    expect(prisma.transfer.create).not.toHaveBeenCalled();
  });

  it('rejects a transfer exceeding the source remaining', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'savings' });
    requireOpenMonth.mockResolvedValue({ id: 'bm-1' });
    prisma.categoryMonthSnapshot.findUnique.mockResolvedValue({
      closing_balance: '500', // меньше переводимой 1000
    });

    await expect(service.create('user-1', dto)).rejects.toThrow(
      'Insufficient funds in source envelope',
    );
    expect(prisma.transfer.create).not.toHaveBeenCalled();
  });

  it('creates the transfer and projects it when funds are sufficient', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'cat' });
    requireOpenMonth.mockResolvedValue({ id: 'bm-1' });
    prisma.categoryMonthSnapshot.findUnique.mockResolvedValue({
      closing_balance: '5000',
    });
    const created = { id: 'tr-1', ...dto, user_id: 'user-1' };
    prisma.transfer.create.mockResolvedValue(created);

    const result = await service.create('user-1', dto);

    expect(prisma.transfer.create).toHaveBeenCalledWith({
      data: {
        user_id: 'user-1',
        from_category_id: 'savings',
        to_category_id: 'repair',
        amount: 1_000,
        period_month: new Date('2026-06-01'),
      },
    });
    expect(onTransferCreated).toHaveBeenCalledWith(prisma, created);
    expect(result).toBe(created);
  });

  it('creates a withdrawal to the free pool when the target is omitted', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'savings' });
    requireOpenMonth.mockResolvedValue({ id: 'bm-1' });
    prisma.categoryMonthSnapshot.findUnique.mockResolvedValue({
      closing_balance: '5000',
    });
    const created = {
      id: 'tr-2',
      user_id: 'user-1',
      from_category_id: 'savings',
      to_category_id: null,
      amount: 1_000,
      period_month: '2026-06-01',
    };
    prisma.transfer.create.mockResolvedValue(created);

    await service.create('user-1', {
      from_category_id: 'savings',
      amount: 1_000,
      period_month: '2026-06-01',
    });

    // получателя нет → проверяется только источник
    expect(prisma.category.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.transfer.create).toHaveBeenCalledWith({
      data: {
        user_id: 'user-1',
        from_category_id: 'savings',
        to_category_id: null,
        amount: 1_000,
        period_month: new Date('2026-06-01'),
      },
    });
    expect(onTransferCreated).toHaveBeenCalledWith(prisma, created);
  });
});
