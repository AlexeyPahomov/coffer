import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

import { BootstrapService } from './bootstrap.service';

describe('BootstrapService', () => {
  let service: BootstrapService;

  const plannedExpenseService = {
    findAll: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const allocationRuleService = {
    findAll: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const budgetCycleService = {
    getClosedPeriodMonths: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    getCurrentViewFromInputs: jest.fn(),
  };
  const budgetMonthService = {
    getBudgetMonthMeta: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    getViewOrOpenFromInputs:
      jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const budgetLedgerSummaryService = { computeFromInputs: jest.fn() };
  const rebuildService = {
    loadBootstrapLedgerBundle:
      jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    toRebuildInputs: jest.fn(),
  };

  const ledgerBundle = {
    categories: [{ id: 'cat-1', created_at: new Date('2026-06-01') }],
    incomes: [
      {
        id: 'income-1',
        amount: { toString: () => '1000' },
        status: 'RECEIVED',
        period_month: new Date('2026-06-01'),
        received_at: new Date('2026-06-02'),
        created_at: new Date('2026-06-02'),
      },
    ],
    allocations: [],
    expenses: [],
  };
  const rebuildInputs = {
    categories: [],
    allocations: [],
    expenses: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    rebuildService.loadBootstrapLedgerBundle.mockResolvedValue(ledgerBundle);
    rebuildService.toRebuildInputs.mockReturnValue(rebuildInputs);
    budgetCycleService.getClosedPeriodMonths.mockResolvedValue(new Set());
    budgetMonthService.getBudgetMonthMeta.mockResolvedValue({
      id: 'month-1',
      status: 'OPEN',
    });
    budgetLedgerSummaryService.computeFromInputs.mockReturnValue({
      periodMonth: '2026-06',
      openingFreePool: 0,
      savingsReserveBalance: 0,
      incomeTotal: 0,
      allocatedTotal: 0,
      spentTotal: 0,
      freePoolExpenseTotal: 0,
      overspendCharge: 0,
      nonEnvelopeSpentByCategoryId: {},
    });

    service = new BootstrapService(
      plannedExpenseService as never,
      allocationRuleService as never,
      budgetCycleService as never,
      budgetMonthService as never,
      budgetLedgerSummaryService as never,
      rebuildService as never,
    );
  });

  it('aggregates core lists and materialized budget month', async () => {
    plannedExpenseService.findAll.mockResolvedValue([{ id: 'plan-1' }]);
    allocationRuleService.findAll.mockResolvedValue([{ id: 'rule-1' }]);
    budgetCycleService.getCurrentViewFromInputs.mockReturnValue({
      asOf: '2026-06-24',
      snapshots: [],
    });
    budgetMonthService.getViewOrOpenFromInputs.mockResolvedValue({
      periodMonth: '2026-06',
      status: 'OPEN',
      snapshots: [],
    });

    const result = await service.getBootstrap(
      'user-1',
      '2026-06',
      '2026-06-24',
    );

    expect(result.periodMonth).toBe('2026-06');
    expect(result.asOf).toBe('2026-06-24');
    expect(result.categories).toHaveLength(1);
    expect(result.periodLedgerSummary.periodMonth).toBe('2026-06');
    expect(result.budgetCycle).not.toBeNull();
    expect(rebuildService.loadBootstrapLedgerBundle).toHaveBeenCalledWith(
      'user-1',
    );
    expect(rebuildService.toRebuildInputs).toHaveBeenCalledWith(ledgerBundle);
    expect(budgetLedgerSummaryService.computeFromInputs).toHaveBeenCalledWith(
      rebuildInputs,
      expect.any(Array),
      '2026-06',
    );
    expect(budgetCycleService.getCurrentViewFromInputs).toHaveBeenCalledWith(
      '2026-06-24',
      expect.any(Set),
      ledgerBundle,
    );
    expect(budgetMonthService.getViewOrOpenFromInputs).toHaveBeenCalledWith(
      'user-1',
      '2026-06',
      rebuildInputs,
      {
        monthMeta: expect.objectContaining({ id: 'month-1' }),
        categories: ledgerBundle.categories,
      },
    );
  });

  it('returns null budget cycle when there is no active cycle', async () => {
    plannedExpenseService.findAll.mockResolvedValue([]);
    allocationRuleService.findAll.mockResolvedValue([]);
    budgetCycleService.getCurrentViewFromInputs.mockImplementation(() => {
      throw new NotFoundException('No active income cycle');
    });
    budgetMonthService.getViewOrOpenFromInputs.mockResolvedValue({
      periodMonth: '2026-06',
      status: 'OPEN',
      snapshots: [],
    });

    const result = await service.getBootstrap(
      'user-1',
      '2026-06',
      '2026-06-24',
    );

    expect(result.budgetCycle).toBeNull();
  });
});
