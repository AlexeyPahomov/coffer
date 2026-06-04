import type { CategorySnapshotDto } from './budget-month.view.dto';

export type BudgetCycleIncomeDto = {
  id: string;
  amount: number;
  source: string | null;
  incomeType: string;
  periodMonth: string;
  receivedAt: string;
};

export type BudgetCycleViewDto = {
  asOf: string;
  cycleStart: string;
  cycleEnd: string | null;
  income: BudgetCycleIncomeDto;
  snapshots: CategorySnapshotDto[];
};
