import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildForecastChain } from './buildForecastChain.js'
import { buildMonthProjection } from '../projection/buildMonthProjection.js'

describe('buildForecastChain', () => {
  it('propagates projectedFree into next month opening (sequential)', () => {
    const chain = buildForecastChain({
      months: [
        {
          month: '2026-06',
          income: 100_000,
          commitmentRows: [
            { amount: 30_000, reserved_amount: 30_000, status: 'RESERVED' },
          ],
        },
        {
          month: '2026-07',
          income: 80_000,
          commitmentRows: [],
        },
      ],
    })

    assert.equal(chain.months[0]!.openingBalance, 0)
    assert.equal(chain.months[0]!.available, 100_000)
    assert.equal(chain.months[0]!.projectedFree, 70_000)

    assert.equal(chain.months[1]!.openingBalance, 70_000)
    assert.equal(chain.months[1]!.available, 150_000)
    assert.equal(chain.months[1]!.projectedFree, 150_000)
  })

  it('differs from independent per-month projection', () => {
    const rows = [
      {
        month: '2026-06',
        income: 100_000,
        commitmentRows: [
          { amount: 40_000, reserved_amount: 0, status: 'PLANNED' },
        ],
      },
      {
        month: '2026-07',
        income: 0,
        commitmentRows: [
          { amount: 50_000, reserved_amount: 0, status: 'PLANNED' },
        ],
      },
    ] as const

    const chain = buildForecastChain({ months: rows })

    const isolatedJuly = buildMonthProjection({
      available: rows[1].income,
      spentTotal: 0,
      commitmentRows: rows[1].commitmentRows,
    })

    assert.equal(chain.months[1]!.projectedFree, 10_000)
    assert.equal(isolatedJuly.projectedFree, -50_000)
    assert.notEqual(
      chain.months[1]!.projectedFree,
      isolatedJuly.projectedFree,
    )
  })

  it('propagates deficit and sets NEGATIVE_CARRY on following month', () => {
    const chain = buildForecastChain({
      months: [
        {
          month: '2026-06',
          income: 10_000,
          commitmentRows: [
            { amount: 50_000, reserved_amount: 50_000, status: 'RESERVED' },
          ],
        },
        {
          month: '2026-07',
          income: 5_000,
          commitmentRows: [],
        },
      ],
    })

    assert.equal(chain.months[0]!.projectedFree, -40_000)
    assert.equal(chain.months[0]!.deficit, 40_000)
    assert.ok(
      chain.months[0]!.warnings.some((w) => w.type === 'DEFICIT'),
    )

    assert.equal(chain.months[1]!.openingBalance, -40_000)
    assert.ok(
      chain.months[1]!.warnings.some((w) => w.type === 'NEGATIVE_CARRY'),
    )
    assert.equal(chain.metadata.hasDeficit, true)
    assert.equal(chain.metadata.firstDeficitMonth, '2026-06')
    assert.equal(chain.metadata.propagatedDeficitMonths[0], '2026-07')
  })

  it('includes carryOver and liquidityAdjustment in available', () => {
    const chain = buildForecastChain({
      initialOpening: 5_000,
      months: [
        {
          month: '2026-08',
          income: 20_000,
          carryOver: 3_000,
          liquidityAdjustment: 2_000,
          commitmentRows: [],
        },
      ],
    })

    assert.equal(chain.months[0]!.openingBalance, 5_000)
    assert.equal(chain.months[0]!.available, 30_000)
  })

  it('subtracts expected envelope allocation from available liquidity', () => {
    const chain = buildForecastChain({
      initialOpening: 20_000,
      months: [
        {
          month: '2026-06',
          income: 90_000,
          expectedEnvelopeAllocation: 90_000,
          commitmentRows: [
            { amount: 40_000, reserved_amount: 0, status: 'PLANNED' },
            { amount: 20_000, reserved_amount: 0, status: 'PLANNED' },
            { amount: 15_000, reserved_amount: 15_000, status: 'RESERVED' },
            { amount: 15_000, reserved_amount: 15_000, status: 'RESERVED' },
          ],
        },
      ],
    })

    assert.equal(chain.months[0]!.openingBalance, 20_000)
    assert.equal(chain.months[0]!.income, 90_000)
    assert.equal(chain.months[0]!.expectedEnvelopeAllocation, 90_000)
    assert.equal(chain.months[0]!.available, 20_000)
    assert.equal(chain.months[0]!.planned, 60_000)
    assert.equal(chain.months[0]!.reserved, 30_000)
    assert.equal(chain.months[0]!.projectedFree, -70_000)
  })

  it('flags OVERBOOKED when commitments exceed available pool', () => {
    const chain = buildForecastChain({
      months: [
        {
          month: '2026-09',
          income: 10_000,
          commitmentRows: [
            { amount: 15_000, reserved_amount: 0, status: 'PLANNED' },
          ],
        },
      ],
    })

    assert.ok(
      chain.months[0]!.warnings.some((w) => w.type === 'OVERBOOKED'),
    )
    assert.equal(chain.metadata.warningsByType.OVERBOOKED, 1)
  })
})
