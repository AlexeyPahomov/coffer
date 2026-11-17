import {
  differenceInCalendarDays,
  endOfMonth,
  getDate,
  getDaysInMonth,
} from 'date-fns';

import { pluralRu } from '@/shared/lib/plural';

import { getEnvelopeUsage } from './envelopeUsage';

export type MonthlyBurnPaceDirection = 'above' | 'below' | 'on_track';

export type MonthlyBurnInsight = {
  spentPercent: number;
  daysRemaining: number;
  daysRemainingLabel: string;
  paceDelta: number;
  paceDirection: MonthlyBurnPaceDirection;
  paceMessage: string;
};

const PACE_MESSAGE_THRESHOLD_PERCENT = 3;

/** Склонение «N дней» для подписи «До конца месяца». */
export function formatRuDaysCount(count: number): string {
  return `${count} ${pluralRu(count, 'день', 'дня', 'дней')}`;
}

export function getDaysRemainingInMonth(referenceDate: Date): number {
  const end = endOfMonth(referenceDate);
  return Math.max(0, differenceInCalendarDays(end, referenceDate));
}

export function getMonthlyBurnPace(
  spentPercent: number,
  referenceDate: Date,
): { paceDelta: number; paceDirection: MonthlyBurnPaceDirection } {
  const dayOfMonth = getDate(referenceDate);
  const daysInMonth = getDaysInMonth(referenceDate);
  const expectedPercent = (dayOfMonth / daysInMonth) * 100;
  const paceDelta = Math.round(spentPercent - expectedPercent);

  if (paceDelta > PACE_MESSAGE_THRESHOLD_PERCENT) {
    return { paceDelta, paceDirection: 'above' };
  }
  if (paceDelta < -PACE_MESSAGE_THRESHOLD_PERCENT) {
    return { paceDelta, paceDirection: 'below' };
  }
  return { paceDelta, paceDirection: 'on_track' };
}

export function formatMonthlyBurnPaceMessage(
  paceDelta: number,
  direction: MonthlyBurnPaceDirection,
): string {
  if (direction === 'on_track') {
    return 'Темп в норме';
  }

  const magnitude = Math.abs(paceDelta);
  if (direction === 'above') {
    return `Темп выше нормы на ${magnitude}%`;
  }
  return `Темп ниже нормы на ${magnitude}%`;
}

export function monthlyBurnPaceClassName(
  direction: MonthlyBurnPaceDirection,
): string {
  switch (direction) {
    case 'above':
      return 'font-medium text-orange';
    case 'below':
      return 'font-medium text-green';
    default:
      return 'text-zinc-500';
  }
}

/** Фиксированная высота блока инсайта (2 строки) — одинаковые карточки в сетке. */
export const monthlyBurnInsightSlotClassName =
  'min-h-4 shrink-0 text-xs leading-relaxed';

/** Инсайт «сжигания» бюджета за календарный месяц (линейный темп vs факт). */
export function getMonthlyBurnInsight(
  allocated: number,
  spent: number,
  referenceDate: Date = new Date(),
): MonthlyBurnInsight {
  const { displayPercent } = getEnvelopeUsage(allocated, spent);
  const daysRemaining = getDaysRemainingInMonth(referenceDate);
  const { paceDelta, paceDirection } = getMonthlyBurnPace(
    displayPercent,
    referenceDate,
  );

  return {
    spentPercent: displayPercent,
    daysRemaining,
    daysRemainingLabel: formatRuDaysCount(daysRemaining),
    paceDelta,
    paceDirection,
    paceMessage: formatMonthlyBurnPaceMessage(paceDelta, paceDirection),
  };
}
