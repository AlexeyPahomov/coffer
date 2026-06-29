/**
 * Prisma Decimal (через `toString`) и числа → number для арифметики на сервере.
 *
 * Инвариант: суммы — рубли с точностью до копейки; точное хранение в БД (Decimal),
 * number — только для расчётов. Централизованного округления пока нет (см.
 * money.ts в `@coffer/shared`) — при длинных цепочках возможен дрейф float.
 */
export function toMoneyNumber(value: number | string): number {
  return Number(value);
}

type PrismaAmountRow = { amount: { toString(): string } };

export function sumPrismaMoneyAmounts(
  items: readonly PrismaAmountRow[],
): number {
  return items.reduce<number>(
    (sum, item) => sum + toMoneyNumber(item.amount.toString()),
    0,
  );
}
