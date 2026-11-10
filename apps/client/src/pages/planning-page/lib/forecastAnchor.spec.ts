import type { PeriodLedgerSummary } from '@coffer/shared'
import { describe, expect, it } from 'vitest'

import {
  buildForecastLeadInMonths,
  resolveForecastAnchorMonth,
  resolveForecastAnchorSummary,
} from './forecastAnchor'

describe('resolveForecastAnchorMonth', () => {
  it('будущий месяц прогнозируется от текущего', () => {
    expect(resolveForecastAnchorMonth('2027-01', '2026-11')).toBe('2026-11')
  })

  it('текущий и прошлый месяц — от своего факта', () => {
    expect(resolveForecastAnchorMonth('2026-11', '2026-11')).toBe('2026-11')
    expect(resolveForecastAnchorMonth('2026-10', '2026-11')).toBe('2026-10')
  })
})

describe('buildForecastLeadInMonths', () => {
  it('месяцы от якоря до выбранного, без него, через границу года', () => {
    expect(buildForecastLeadInMonths('2026-11', '2027-01')).toEqual([
      '2026-11',
      '2026-12',
    ])
  })

  it('пусто, если якорь совпадает с выбранным', () => {
    expect(buildForecastLeadInMonths('2026-11', '2026-11')).toEqual([])
  })
})

describe('resolveForecastAnchorSummary', () => {
  const summary: PeriodLedgerSummary = {
    periodMonth: '2026-11',
    openingFreePool: 0,
    savingsReserveBalance: 10000,
    incomeTotal: 101000,
    allocatedTotal: 35000,
    spentTotal: 91000,
    freePoolExpenseTotal: 60000,
    overspendCharge: 0,
    nonEnvelopeSpentByCategoryId: {},
  }

  it('пул и накопления из сводки якоря', () => {
    expect(resolveForecastAnchorSummary(summary, '2026-11')).toEqual({
      available: 6000,
      inReserve: 10000,
    })
  })

  it('null, если сводка за другой месяц (keepPreviousData)', () => {
    expect(resolveForecastAnchorSummary(summary, '2026-12')).toBeNull()
  })
})
