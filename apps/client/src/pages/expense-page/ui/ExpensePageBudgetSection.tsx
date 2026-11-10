import type { CurrentBudgetSummaryView } from '@/entities/budget/model/currentBudgetSummaryView';
import { PeriodLedgerSummaryError } from '@/entities/period-ledger-summary';
import { SectionLoader } from '@/shared/ui';
import { CurrentBudgetSummary } from '@/widgets/current-budget-summary';

import { expensePageBudgetSectionClassName } from '../lib/expensePageLayout';

export type ExpensePageBudgetSectionProps = {
  summary: CurrentBudgetSummaryView;
  isPending: boolean;
  isError: boolean;
};

export function ExpensePageBudgetSection({
  summary,
  isPending,
  isError,
}: ExpensePageBudgetSectionProps) {
  return (
    <div className={expensePageBudgetSectionClassName}>
      {isPending ? (
        <SectionLoader label="Загрузка сводки" />
      ) : isError ? (
        <PeriodLedgerSummaryError />
      ) : (
        <CurrentBudgetSummary {...summary} />
      )}
    </div>
  );
}
