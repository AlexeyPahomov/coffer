import type {
  CategoryBudgetItem,
  CategoryBudgetSnapshot,
} from '@/entities/budget'

export function toBudgetSnapshots(
  items: readonly CategoryBudgetItem[],
): CategoryBudgetSnapshot[] {
  return items.map((item) => ({
    categoryId: item.category.id,
    categoryName: item.category.name,
    categoryType: item.category.type,
    carriedFromPrevious: item.carriedFromPrevious,
    allocated: item.allocated,
    spent: item.spent,
    remaining: item.remaining,
  }))
}
