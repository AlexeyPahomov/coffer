import { Link } from 'react-router-dom';

import { appRouteHref } from '@/app/config/routes';
import { formatAmount } from '@/shared/lib/format';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';

import { QUICK_TOP_UP_AMOUNTS } from '../model/constants';
import type { SavingsTransferHint } from '../lib/savingsTransferHint';

type ExpenseOverBudgetActionsProps = {
  savingsTransfer?: SavingsTransferHint | null;
  onQuickTopUp: (amount: number) => void;
  onCoverFromSavings?: () => void;
  isRecording: boolean;
  isTopUpPending: boolean;
  isCoverPending: boolean;
  topUpError: string | null;
  canTopUp: boolean;
};

export function ExpenseOverBudgetActions({
  savingsTransfer,
  onQuickTopUp,
  onCoverFromSavings,
  isRecording,
  isTopUpPending,
  isCoverPending,
  topUpError,
  canTopUp,
}: ExpenseOverBudgetActionsProps) {
  const actionsDisabled = isRecording || isTopUpPending || isCoverPending;

  return (
    <div className="space-y-2">
      {savingsTransfer && onCoverFromSavings ? (
        <div className="space-y-1">
          <p className="text-sm text-emerald-900/90">
            В «{savingsTransfer.savingsName}» —{' '}
            {formatAmount(savingsTransfer.available)}.
          </p>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={actionsDisabled}
            onClick={() => onCoverFromSavings()}
          >
            Покрыть из накоплений: +{formatAmount(savingsTransfer.shortfall)}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {QUICK_TOP_UP_AMOUNTS.map((amount) => (
          <Tooltip key={amount}>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={!canTopUp || actionsDisabled}
                  aria-label={`Пополнить конверт: +${formatAmount(amount)}`}
                  onClick={() => onQuickTopUp(amount)}
                >
                  +{formatAmount(amount)}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Пополнить конверт</TooltipContent>
          </Tooltip>
        ))}
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={actionsDisabled}
          asChild
        >
          <Link to={appRouteHref('allocation')}>Пополнить конверт</Link>
        </Button>
      </div>

      {topUpError ? (
        <p className="text-sm text-red">{topUpError}</p>
      ) : !canTopUp && !savingsTransfer ? (
        <p className="text-sm text-orange">
          Нет свободных средств для быстрого пополнения.
        </p>
      ) : null}
    </div>
  );
}
