import type { Category } from '@/entities/category/model/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'

import { useCreatePlannedExpenseForm } from '../model/useCreatePlannedExpenseForm'

import { CreatePlannedExpenseFields } from './CreatePlannedExpenseFields'

export type CreatePlannedExpenseFormProps = {
  anchorPeriodMonth: string
  categories: readonly Category[]
}

export function CreatePlannedExpenseForm({
  anchorPeriodMonth: _anchorPeriodMonth,
  categories,
}: CreatePlannedExpenseFormProps) {
  const form = useCreatePlannedExpenseForm()

  return (
    <Card className="border-zinc-200/80 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Новый план</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CreatePlannedExpenseFields
          values={form.values}
          categories={categories}
          onChange={form.handleChange}
          patchValues={form.patchValues}
          onSubmit={form.submit}
          isPending={form.isPending}
          isSubmitDisabled={form.isSubmitDisabled}
        />
      </CardContent>
    </Card>
  )
}
