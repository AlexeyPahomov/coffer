import type { CurrentBudgetSummaryView } from '@/entities/budget/model/currentBudgetSummaryView';
import { ListError, Spinner } from '@/shared/ui';
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
        <div
          className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/60"
          aria-busy="true"
        >
          <Spinner className="size-6 text-zinc-400" aria-label="Загрузка сводки" />
        </div>
      ) : isError ? (
        <ListError
          error={null}
          fallbackMessage="Не удалось загрузить сводку за месяц — данные недоступны"
        />
      ) : (
        <CurrentBudgetSummary {...summary} />
      )}
    </div>
  );
}
