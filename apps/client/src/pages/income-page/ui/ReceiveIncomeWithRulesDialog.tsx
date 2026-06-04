import { useEffect, useMemo, useState } from 'react'
import { INCOME_TYPE_LABELS } from '@coffer/shared'

import type { AllocationRulePreviewRule } from '@/entities/allocation-rule/model/types'
import { useAllocationRulePreviewQuery } from '@/entities/allocation-rule/api/useAllocationRulePreviewQuery'
import { useApplyAllocationRuleMutation } from '@/entities/allocation-rule/api/useApplyAllocationRuleMutation'
import { CategoryAmountChip } from '@/entities/category/ui/CategoryAmountChip'
import type { Income } from '@/entities/income/model/types'
import { useReceiveIncomeMutation } from '@/entities/income/api/useReceiveIncomeMutation'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  ResponsiveFormDialog,
  Spinner,
} from '@/shared/ui'

type ReceiveIncomeWithRulesDialogProps = {
  income: Income | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ruleAmountLabel(rule: AllocationRulePreviewRule): string {
  return formatMoneyWithRub(rule.total)
}

function rulePoolLabel(rule: AllocationRulePreviewRule): string {
  if (rule.exceedsRemaining) {
    return `Не хватает: ${formatMoneyWithRub(Math.abs(rule.remainingAfterApply))}`
  }
  return `Свободный пул: ${formatMoneyWithRub(rule.remainingAfterApply)}`
}

function ReceiveRulePreviewCard({
  rule,
  selected,
  disabled,
  onSelect,
}: {
  rule: AllocationRulePreviewRule
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'w-full rounded-2xl border bg-white p-3 text-left shadow-sm transition-colors',
        selected
          ? 'border-green-muted bg-green-subtle/60 ring-1 ring-green-muted'
          : 'border-zinc-200 hover:border-zinc-300',
        disabled && 'cursor-not-allowed opacity-60 hover:border-zinc-200',
      )}
      disabled={disabled}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {rule.rule.name}
          </p>
          <p
            className={cn(
              'mt-1 text-xs',
              rule.exceedsRemaining ? 'text-destructive' : 'text-green',
            )}
          >
            {rulePoolLabel(rule)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
          {ruleAmountLabel(rule)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {rule.lines.map((line, index) => (
          <CategoryAmountChip
            key={`${rule.rule.id}-${line.category_id}-${index}`}
            category={line.category}
            value={formatMoneyWithRub(line.amount)}
          />
        ))}
      </div>
    </button>
  )
}

export function ReceiveIncomeWithRulesDialog({
  income,
  open,
  onOpenChange,
}: ReceiveIncomeWithRulesDialogProps) {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [incomeReceived, setIncomeReceived] = useState(false)
  const previewQuery = useAllocationRulePreviewQuery(
    open ? income?.id ?? null : null,
  )
  const receiveMutation = useReceiveIncomeMutation()
  const applyMutation = useApplyAllocationRuleMutation()

  const applicableRules = previewQuery.data?.rules ?? []
  const selectableRules = useMemo(
    () => applicableRules.filter((rule) => !rule.exceedsRemaining),
    [applicableRules],
  )
  const selectedRule = applicableRules.find(
    (rule) => rule.rule.id === selectedRuleId,
  )
  const isSubmitting = receiveMutation.isPending || applyMutation.isPending
  const error = receiveMutation.error ?? applyMutation.error ?? previewQuery.error

  useEffect(() => {
    if (selectedRuleId !== null || selectableRules.length === 0) {
      return
    }
    setSelectedRuleId(selectableRules[0].rule.id)
  }, [selectableRules, selectedRuleId])

  async function receiveOnly() {
    if (!income) {
      return
    }
    if (!incomeReceived) {
      await receiveMutation.mutateAsync(income.id)
      setIncomeReceived(true)
    }
    onOpenChange(false)
  }

  async function receiveAndApply() {
    if (!income || !selectedRule || selectedRule.exceedsRemaining) {
      return
    }
    if (!incomeReceived) {
      await receiveMutation.mutateAsync(income.id)
      setIncomeReceived(true)
    }
    await applyMutation.mutateAsync({
      income_id: income.id,
      rule_id: selectedRule.rule.id,
    })
    onOpenChange(false)
  }

  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Получить доход"
      description="Проверьте правила распределения перед переводом дохода в факт."
      bodyClassName="space-y-4"
    >
      {income ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">
            {income.source?.trim() || INCOME_TYPE_LABELS[income.income_type]}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
            {formatMoneyWithRub(income.amount)}
          </p>
        </div>
      ) : null}

      {previewQuery.isPending ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
          <Spinner />
          Загружаем правила
        </div>
      ) : null}

      {!previewQuery.isPending && applicableRules.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-zinc-800">
            Применить правило распределения?
          </p>
          {applicableRules.map((rule) => (
            <ReceiveRulePreviewCard
              key={rule.rule.id}
              rule={rule}
              selected={selectedRuleId === rule.rule.id}
              disabled={isSubmitting || rule.exceedsRemaining}
              onSelect={() => setSelectedRuleId(rule.rule.id)}
            />
          ))}
        </div>
      ) : null}

      {!previewQuery.isPending &&
      !previewQuery.isError &&
      applicableRules.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-500">
          Для этого дохода нет подходящих активных правил. Можно получить доход
          сейчас и распределить его позже вручную.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(error, 'Не удалось получить доход')}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Отмена
        </Button>
        <Button
          type="button"
          variant="secondary"
          isLoading={receiveMutation.isPending && !applyMutation.isPending}
          disabled={isSubmitting || !income}
          className="w-full"
          onClick={() => void receiveOnly()}
        >
          Получить без распределения
        </Button>
        {applicableRules.length > 0 ? (
          <Button
            type="button"
            isLoading={isSubmitting}
            disabled={isSubmitting || !income || !selectedRule}
            className="w-full"
            onClick={() => void receiveAndApply()}
          >
            Получить и применить
          </Button>
        ) : null}
      </div>
    </ResponsiveFormDialog>
  )
}
