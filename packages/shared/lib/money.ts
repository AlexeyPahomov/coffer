/** Число, JSON-строка или Prisma Decimal (через `toString`). */
export type MoneyInput = number | string | { toString(): string }

const moneyGroupingSeparatorPattern = /[\s\u00a0\u202f]/g

const ruMoneyFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: true,
})

/**
 * Prisma Decimal и JSON-строки сумм → число для арифметики на JS-стороне.
 *
 * Инвариант: суммы — рубли с точностью до копейки (≤ 2 знаков после запятой,
 * «целые копейки»). Точное хранение — Decimal в БД; в `number` переводим только
 * для расчётов. При длинных цепочках сложений/переносов (closing → opening
 * следующего месяца) возможен дрейф двоичного float. Централизованного
 * округления пока нет (Decimal.js намеренно отложен) — не вводите доли копейки.
 */
export function toMoneyNumber(value: MoneyInput): number {
  return Number(value)
}

function normalizeMoneyNumber(value: MoneyInput): number | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const normalized = trimmed
      .replace(moneyGroupingSeparatorPattern, '')
      .replace(',', '.')

    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  const parsed = toMoneyNumber(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Парсинг суммы из поля ввода (`1 234,56` → `1234.56`). */
export function parseMoneyInput(raw: string): number | null {
  const parsed = normalizeMoneyNumber(raw)
  if (parsed === null || parsed <= 0) {
    return null
  }
  return parsed
}

/** Форматирование суммы для UI (`5000` → `5 000`). */
export function formatMoneyAmount(value: MoneyInput): string {
  const amount = normalizeMoneyNumber(value)
  if (amount === null) {
    return ''
  }

  return ruMoneyFormatter.format(amount)
}

export function sumMoneyAmounts(amounts: readonly MoneyInput[]): number {
  return amounts.reduce<number>(
    (sum, amount) => sum + toMoneyNumber(amount),
    0,
  )
}
