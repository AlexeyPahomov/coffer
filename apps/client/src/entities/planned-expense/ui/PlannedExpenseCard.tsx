import { Check, Lock, LockOpen, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { cancelMenuItemClassName } from '@/shared/lib/cancelMenuItemLayout'
import { formatDateRangeLabel } from '@/shared/lib/date'
import { formatMoneyRange, formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
} from '@/shared/ui'

import {
  plannedExpenseCardAmountClassName,
  plannedExpenseCardClassName,
  plannedExpenseCardDateClassName,
  plannedExpenseCardDescriptionClassName,
  plannedExpenseCardFinanceClassName,
  plannedExpenseCardMetaClassName,
  plannedExpenseCardMainClassName,
  plannedExpenseCardProgressTextClassName,
  plannedExpenseCardRowClassName,
  plannedExpenseCardStatusClassName,
  plannedExpenseCardTextClassName,
  plannedExpenseCardTitleClassName,
  plannedExpensePlannedBadgeClassName,
  plannedExpensePlannedBadgeStaticClassName,
  plannedExpenseReserveMenuItemClassName,
  plannedExpenseUnreserveMenuItemClassName,
  plannedExpenseReservedBadgeClassName,
  plannedExpenseReservedBadgeStaticClassName,
} from '../lib/plannedExpenseCardLayout'
import { canFinishPlannedExpense } from '../lib/canFinishPlannedExpense'
import { canUnfinishPlannedExpense } from '../lib/canUnfinishPlannedExpense'
import type { PlannedExpenseStatusMutationArgs } from '../lib/fullReserveMutationArgs'
import { resolveIconColorTone } from '@/shared/lib/iconColorStyles'
import { PLANNED_EXPENSE_STATUS_LABELS } from '../lib/plannedExpenseStatus'
import type { PlannedExpense } from '../model/types'
import { PlannedExpenseIconAvatar } from './PlannedExpenseIconAvatar'

const statusBadgeInteractiveClassName =
  'rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 disabled:pointer-events-none disabled:opacity-50'

const statusBadgeStaticClassName = 'rounded-md bg-zinc-100 text-zinc-600'

export type PlannedExpenseCardProps = {
  item: PlannedExpense
  onReserve?: (id: string) => void
  onCancelPlan?: (id: string) => void
  onUnreserve?: (id: string) => void
  onFinish?: (item: PlannedExpense) => void
  onUnfinish?: (id: string) => void
  onEdit?: (item: PlannedExpense) => void
  pendingStatusMutation?: PlannedExpenseStatusMutationArgs
  pendingUnfinishId?: string
  className?: string
}

export function PlannedExpenseCard({
  item,
  onReserve,
  onCancelPlan,
  onUnreserve,
  onFinish,
  onUnfinish,
  onEdit,
  pendingStatusMutation,
  pendingUnfinishId,
  className,
}: PlannedExpenseCardProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusMutationPending = pendingStatusMutation != null
  const isPendingForItem = pendingStatusMutation?.id === item.id
  const isReserveLoading =
    isPendingForItem && pendingStatusMutation?.status === 'RESERVED'
  const isUnreserveLoading =
    isPendingForItem &&
    pendingStatusMutation?.status === 'PLANNED' &&
    pendingStatusMutation.reserveAmount === 0
  const isCancelPlanLoading =
    isPendingForItem && pendingStatusMutation?.status === 'CANCELLED'
  const showReserve = item.status === 'PLANNED' && onReserve != null
  const showCancelPlan = item.status === 'PLANNED' && onCancelPlan != null
  const showPlannedMenu =
    item.status === 'PLANNED' &&
    (showReserve || onEdit != null || showCancelPlan)
  const showUnreserveMenu = item.reserved_amount > 0 && onUnreserve != null
  const showFinishMenu = canFinishPlannedExpense(item) && onFinish != null
  const showUnfinishMenu = canUnfinishPlannedExpense(item) && onUnfinish != null
  const showReservedMenu = showUnreserveMenu || showFinishMenu
  const showCompletedMenu = showUnfinishMenu
  const isUnfinishLoading = pendingUnfinishId === item.id
  const actionPending = statusMutationPending || isUnfinishLoading
  const statusLabel = PLANNED_EXPENSE_STATUS_LABELS[item.status]
  const tone = resolveIconColorTone(item.icon_color)
  const currentAmount = item.reserved_amount
  const targetAmount = item.amount
  const showProgress =
    currentAmount > 0 && currentAmount < targetAmount && targetAmount > 0
  const progressValue =
    targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
      : 0

  const closeStatusMenu = () => setStatusMenuOpen(false)

  const statusBadgeClassName =
    item.status === 'RESERVED' && showReservedMenu
      ? plannedExpenseReservedBadgeClassName
      : item.status === 'COMPLETED' && showCompletedMenu
        ? plannedExpenseReservedBadgeClassName
        : showPlannedMenu
          ? plannedExpensePlannedBadgeClassName
          : statusBadgeInteractiveClassName

  const statusBadge =
    showPlannedMenu || showReservedMenu || showCompletedMenu ? (
      <Popover open={statusMenuOpen} onOpenChange={setStatusMenuOpen}>
        <PopoverTrigger asChild>
          <Badge asChild className={statusBadgeClassName}>
            <button
              type="button"
              disabled={actionPending}
              aria-label={`Статус: ${statusLabel}. Действия`}
            >
              {statusLabel}
            </button>
          </Badge>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44 p-1">
          {showReserve ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={plannedExpenseReserveMenuItemClassName}
              disabled={actionPending}
              isLoading={isReserveLoading}
              onClick={() => {
                closeStatusMenu()
                onReserve(item.id)
              }}
            >
              <Lock className="size-4 shrink-0" />
              Зарезервировать
            </Button>
          ) : null}
          {showPlannedMenu && onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              disabled={actionPending}
              onClick={() => {
                closeStatusMenu()
                onEdit(item)
              }}
            >
              <Pencil className="size-4" />
              Изменить
            </Button>
          ) : null}
          {showPlannedMenu && showCancelPlan ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cancelMenuItemClassName}
              disabled={actionPending}
              isLoading={isCancelPlanLoading}
              onClick={() => {
                closeStatusMenu()
                onCancelPlan(item.id)
              }}
            >
              <Trash2 className="size-4 shrink-0" />
              Отменить план
            </Button>
          ) : null}
          {showUnreserveMenu && !showPlannedMenu ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={plannedExpenseUnreserveMenuItemClassName}
              disabled={actionPending}
              isLoading={isUnreserveLoading}
              onClick={() => {
                closeStatusMenu()
                onUnreserve(item.id)
              }}
            >
              <LockOpen className="size-4 shrink-0" />
              Снять резерв
            </Button>
          ) : null}
          {showFinishMenu && !showPlannedMenu ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              disabled={actionPending}
              onClick={() => {
                closeStatusMenu()
                onFinish(item)
              }}
            >
              <Check className="size-4 shrink-0" />
              Провести расход
            </Button>
          ) : null}
          {showUnfinishMenu ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={plannedExpenseUnreserveMenuItemClassName}
              disabled={actionPending}
              isLoading={isUnfinishLoading}
              onClick={() => {
                closeStatusMenu()
                onUnfinish(item.id)
              }}
            >
              <RotateCcw className="size-4 shrink-0" />
              Отменить проведение
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    ) : (
      <Badge
        className={
          item.status === 'RESERVED'
            ? plannedExpenseReservedBadgeStaticClassName
            : item.status === 'PLANNED'
              ? plannedExpensePlannedBadgeStaticClassName
              : statusBadgeStaticClassName
        }
      >
        {statusLabel}
      </Badge>
    )

  return (
    <article className={cn(plannedExpenseCardClassName, className)}>
      <div className={plannedExpenseCardRowClassName}>
        <div className={plannedExpenseCardMainClassName}>
          <PlannedExpenseIconAvatar
            iconName={item.icon_name}
            iconColor={item.icon_color}
          />

          <div className={plannedExpenseCardTextClassName}>
            <h3 className={plannedExpenseCardTitleClassName}>{item.title}</h3>
            {item.description ? (
              <p className={plannedExpenseCardDescriptionClassName}>
                {item.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className={plannedExpenseCardMetaClassName}>
          <div className={plannedExpenseCardFinanceClassName}>
            <p className={plannedExpenseCardAmountClassName}>
              {formatMoneyWithRub(targetAmount)}
            </p>
            {showProgress ? (
              <>
                <Progress
                  value={progressValue}
                  className="h-1 w-full max-w-36 bg-zinc-100"
                  indicatorClassName={tone.progressClassName}
                />
                <p className={plannedExpenseCardProgressTextClassName}>
                  {formatMoneyRange(currentAmount, targetAmount)}
                </p>
              </>
            ) : null}
          </div>

          <div className={plannedExpenseCardStatusClassName}>{statusBadge}</div>
        </div>

        <p className={plannedExpenseCardDateClassName}>
          {formatDateRangeLabel(item.planned_date, item.planned_date_end)}
        </p>
      </div>
    </article>
  )
}
