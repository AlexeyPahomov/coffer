import { BadRequestException } from '@nestjs/common';

export function dateKeyFromUtcDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateKeyFromUtcDateOptional(d: Date | null): string | null {
  if (!d) {
    return null;
  }
  return dateKeyFromUtcDate(d);
}

export function parseOptionalIsoDate(
  value: string | null | undefined,
): Date | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }
  return new Date(value);
}

export function assertPlannedDateRange(
  plannedDate: Date,
  plannedDateEnd: Date | null,
): void {
  if (!plannedDateEnd) {
    return;
  }
  if (dateKeyFromUtcDate(plannedDateEnd) < dateKeyFromUtcDate(plannedDate)) {
    throw new BadRequestException(
      'planned_date_end must be on or after planned_date',
    );
  }
}

export function didPlannedDateEndChange(
  next: Date | null,
  before: Date | null,
): boolean {
  return (
    dateKeyFromUtcDateOptional(next) !== dateKeyFromUtcDateOptional(before)
  );
}
