import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

import { BootstrapService } from './bootstrap.service';

describe('BootstrapService', () => {
  let service: BootstrapService;

  const categoryService = { findAll: jest.fn() };
  const incomeService = { findAll: jest.fn() };
  const allocationService = { findAll: jest.fn() };
  const expenseService = { findAll: jest.fn() };
  const plannedExpenseService = { findAll: jest.fn() };
  const allocationRuleService = { findAll: jest.fn() };
  const budgetCycleService = { getCurrentView: jest.fn() };
  const budgetMonthService = { getViewOrOpen: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new BootstrapService(
      categoryService as never,
      incomeService as never,
      allocationService as never,
      expenseService as never,
      plannedExpenseService as never,
      allocationRuleService as never,
      budgetCycleService as never,
      budgetMonthService as never,
    );
  });

  it('aggregates core lists and materialized budget month', async () => {
    categoryService.findAll.mockResolvedValue([{ id: 'cat-1' }]);
    incomeService.findAll.mockResolvedValue([{ id: 'income-1' }]);
    allocationService.findAll.mockResolvedValue([{ id: 'alloc-1' }]);
    expenseService.findAll.mockResolvedValue([{ id: 'expense-1' }]);
    plannedExpenseService.findAll.mockResolvedValue([{ id: 'plan-1' }]);
    allocationRuleService.findAll.mockResolvedValue([{ id: 'rule-1' }]);
    budgetCycleService.getCurrentView.mockResolvedValue({
      asOf: '2026-06-24',
      snapshots: [],
    });
    budgetMonthService.getViewOrOpen.mockResolvedValue({
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
    expect(result.budgetCycle).not.toBeNull();
    expect(budgetMonthService.getViewOrOpen).toHaveBeenCalledWith(
      'user-1',
      '2026-06',
    );
  });

  it('returns null budget cycle when there is no active cycle', async () => {
    categoryService.findAll.mockResolvedValue([]);
    incomeService.findAll.mockResolvedValue([]);
    allocationService.findAll.mockResolvedValue([]);
    expenseService.findAll.mockResolvedValue([]);
    plannedExpenseService.findAll.mockResolvedValue([]);
    allocationRuleService.findAll.mockResolvedValue([]);
    budgetCycleService.getCurrentView.mockRejectedValue(
      new NotFoundException('No active income cycle'),
    );
    budgetMonthService.getViewOrOpen.mockResolvedValue({
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
