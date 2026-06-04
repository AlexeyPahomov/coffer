import { getCalendarDateKey, getMonthKeyFromIso } from '@coffer/shared';

export type ParsedPeriodMonth = {
  year: number;
  month: number;
};

export { parsePeriodMonthKey } from '@coffer/shared';

/** Ключ учётного месяца `YYYY-MM` из Prisma `Date` (см. `@coffer/shared` budgetDateFormat). */
export function formatPeriodMonthKeyFromDate(date: Date): string {
  const key = getMonthKeyFromIso(date.toISOString());
  if (key) {
    return key;
  }
  const calendar = getCalendarDateKey(date);
  return calendar ? calendar.slice(0, 7) : date.toISOString().slice(0, 7);
}
