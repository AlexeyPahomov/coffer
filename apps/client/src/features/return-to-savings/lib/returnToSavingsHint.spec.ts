import { describe, expect, it } from 'vitest'

import type { CategoryBudgetItem, CategoryBudgetSnapshot } from '@/entities/budget'
import type { Category, CategoryType } from '@/entities/category/model/types'

import { buildReturnToSavingsHint } from './returnToSavingsHint'

function category(id: string, type: CategoryType): Category {
  return {
    id,
    user_id: 'u1',
    name: id,
    type,
    icon: 'wallet' as Category['icon'],
    icon_color: 'gray' as Category['icon_color'],
    carry_over_policy: 'CARRY' as Category['carry_over_policy'],
    created_at: '2026-06-01T00:00:00.000Z',
  }
}

function item(
  over: Partial<CategoryBudgetItem> & { category: Category },
): CategoryBudgetItem {
  return { carriedFromPrevious: 0, allocated: 0, spent: 0, remaining: 0, ...over }
}

function savings(id: string, remaining: number): CategoryBudgetSnapshot {
  return {
    categoryId: id,
    categoryName: id,
    categoryType: 'savings',
    carriedFromPrevious: 0,
    allocated: 0,
    spent: 0,
    remaining,
  }
}

describe('buildReturnToSavingsHint', () => {
  it('returns a hint for a limited envelope with a surplus and a savings target', () => {
    const hint = buildReturnToSavingsHint(
      item({ category: category('repair', 'expense'), allocated: 2_000, remaining: 1_500 }),
      [savings('acc', 0)],
    )

    expect(hint).toEqual({
      savingsCategoryId: 'acc',
      savingsName: 'acc',
      amount: 1_500,
    })
  })

  it('returns null without a surplus', () => {
    const hint = buildReturnToSavingsHint(
      item({ category: category('repair', 'expense'), allocated: 2_000, remaining: 0 }),
      [savings('acc', 0)],
    )
    expect(hint).toBeNull()
  })

  it('returns null when there is no savings target', () => {
    const hint = buildReturnToSavingsHint(
      item({ category: category('repair', 'expense'), allocated: 2_000, remaining: 1_500 }),
      [],
    )
    expect(hint).toBeNull()
  })

  it('returns null for a savings envelope itself', () => {
    const hint = buildReturnToSavingsHint(
      item({ category: category('acc', 'savings'), allocated: 5_000, remaining: 5_000 }),
      [savings('acc2', 0)],
    )
    expect(hint).toBeNull()
  })

  it('returns null for a limitless envelope (free-pool surplus is not an envelope balance)', () => {
    const hint = buildReturnToSavingsHint(
      item({ category: category('misc', 'expense'), allocated: 0, remaining: 1_000 }),
      [savings('acc', 0)],
    )
    expect(hint).toBeNull()
  })

  it('picks the savings target with the largest remaining', () => {
    const hint = buildReturnToSavingsHint(
      item({ category: category('repair', 'expense'), allocated: 2_000, remaining: 1_500 }),
      [savings('small', 100), savings('big', 900)],
    )
    expect(hint?.savingsCategoryId).toBe('big')
  })
})
