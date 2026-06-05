import { INCOME_TYPE_LABELS, formatMoneyAmount } from '@coffer/shared'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import { CategoryAmountChip } from '@/entities/category/ui/CategoryAmountChip'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui'

import {
  allocationRulesCardClassName,
  allocationRulesCardLinesGridClassName,
} from '../lib/allocationRulesPageLayout'

type AllocationRuleCardProps = {
  rule: AllocationRule
  onEdit?: (rule: AllocationRule) => void
  onDelete?: (ruleId: string) => void
  isDeleting?: boolean
}

type AllocationRuleCardActionsProps = {
  rule: AllocationRule
  onEdit?: (rule: AllocationRule) => void
  onDelete?: (ruleId: string) => void
  isDeleting: boolean
}

function lineValue(line: AllocationRule['lines'][number]): string {
  if (line.mode === 'PERCENT') {
    return `${formatMoneyAmount(line.percent ?? 0)}%`
  }
  return `${formatMoneyAmount(line.amount ?? 0)} ₽`
}

function AllocationRuleLineChip({
  line,
}: {
  line: AllocationRule['lines'][number]
}) {
  return (
    <CategoryAmountChip
      category={line.category}
      value={lineValue(line)}
      className="flex w-full min-w-0 border border-white/70 transition-colors hover:border-zinc-200"
      focusable
    />
  )
}

function AllocationRuleCardActions({
  rule,
  onEdit,
  onDelete,
  isDeleting,
}: AllocationRuleCardActionsProps) {
  if (!onEdit && !onDelete) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Действия с правилом"
          disabled={isDeleting}
          className="absolute right-3 top-3"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit ? (
          <DropdownMenuItem onSelect={() => onEdit(rule)}>
            <Pencil />
            Изменить
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(rule.id)}
          >
            <Trash2 />
            Удалить
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AllocationRuleCard({
  rule,
  onEdit,
  onDelete,
  isDeleting = false,
}: AllocationRuleCardProps) {
  const triggerLabel = rule.trigger_income_type
    ? INCOME_TYPE_LABELS[rule.trigger_income_type]
    : 'Любой доход'
  const statusLabel = rule.is_active ? 'Активно' : 'Отключено'

  return (
    <Card
      className={cn(
        allocationRulesCardClassName,
        'relative',
        rule.is_active &&
          'border-green-muted bg-linear-to-br from-green-subtle via-green-subtle to-white/95 ring-1 ring-green-muted/70',
      )}
    >
      <CardHeader className="pb-3 pr-12">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{rule.name}</CardTitle>
          <p className="mt-1 text-xs text-zinc-500">
            {triggerLabel} ·{' '}
            <span className={cn(rule.is_active && 'font-medium text-green')}>
              {statusLabel}
            </span>
          </p>
        </div>
        <AllocationRuleCardActions
          rule={rule}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </CardHeader>
      <CardContent className={allocationRulesCardLinesGridClassName}>
        {rule.lines.map((line) => (
          <AllocationRuleLineChip key={line.id} line={line} />
        ))}
      </CardContent>
    </Card>
  )
}
