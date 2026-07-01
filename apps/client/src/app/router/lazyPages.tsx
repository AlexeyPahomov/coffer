import { lazy } from 'react'

const RELOAD_FLAG = 'coffer:chunk-reloaded'

// После нового деплоя старые lazy-чанки удаляются: их запрос отдаётся SPA-fallback'ом
// как index.html (MIME text/html), и import() падает с "not a valid JavaScript MIME type".
// Один раз перезагружаем страницу, чтобы получить свежий index.html с актуальными ссылками.
// Флаг сбрасывается при успешной загрузке, чтобы ловить и последующие деплои.
function importWithReload<T>(factory: () => Promise<T>): Promise<T> {
  return factory().then(
    (mod) => {
      sessionStorage.removeItem(RELOAD_FLAG)
      return mod
    },
    (err) => {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
        return new Promise<T>(() => {}) // висим до перезагрузки
      }
      throw err
    },
  )
}

export const LazyAllocationPage = lazy(() =>
  importWithReload(() =>
    import('@/pages/allocation-page').then((m) => ({ default: m.AllocationPage })),
  ),
)

export const LazyCategoryPage = lazy(() =>
  importWithReload(() =>
    import('@/pages/category-page').then((m) => ({ default: m.CategoryPage })),
  ),
)

export const LazyExpensePage = lazy(() =>
  importWithReload(() =>
    import('@/pages/expense-page').then((m) => ({ default: m.ExpensePage })),
  ),
)

export const LazyIncomePage = lazy(() =>
  importWithReload(() =>
    import('@/pages/income-page').then((m) => ({ default: m.IncomePage })),
  ),
)

export const LazyPlanningPage = lazy(() =>
  importWithReload(() =>
    import('@/pages/planning-page').then((m) => ({ default: m.PlanningPage })),
  ),
)

export const LazyAllocationRulesPage = lazy(() =>
  importWithReload(() =>
    import('@/pages/allocation-rules-page').then((m) => ({
      default: m.AllocationRulesPage,
    })),
  ),
)
