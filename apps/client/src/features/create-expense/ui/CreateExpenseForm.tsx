import type { ChangeEvent, ReactNode } from 'react';

import type { Allocation } from '@/entities/allocation/model/types';
import type { Category } from '@/entities/category/model/types';
import { CategorySelect } from '@/entities/category/ui/CategorySelect';
import type { Expense } from '@/entities/expense/model/types';
import type { Income } from '@/entities/income/model/types';
import { formLabelClassName } from '@/shared/config/formUi';
import { bindMoneyAmountField } from '@/shared/lib/moneyInput';
import { cn } from '@/shared/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
  Input,
  MoneyInput,
} from '@/shared/ui';

import { buildSavingsTransferHint } from '../lib/savingsTransferHint';
import type { CategoryBudgetSnapshot } from '../model/budget';
import type { CreateExpenseFormValues } from '../model/types';
import { useCreateExpenseForm } from '../model/useCreateExpenseForm';
import { useSyncSelectedCategory } from '../model/useSyncSelectedCategory';

import { CreateExpenseFormActions } from './CreateExpenseFormActions';

export type CreateExpenseFormVariant = 'card' | 'plain';

export type CreateExpenseFormProps = {
  categories: Category[];
  budgets: CategoryBudgetSnapshot[];
  incomes: Income[];
  allocations: Allocation[];
  selectedCategoryId?: string;
  editingExpense?: Expense | null;
  onCancelEdit?: () => void;
  onComplete?: () => void;
  onStressCategoryChange?: (categoryId: string | null) => void;
  /** `plain` — без Card, заголовок снаружи (диалог). */
  variant?: CreateExpenseFormVariant;
  className?: string;
};

function fieldChangeHandler(
  handleChange: (name: keyof CreateExpenseFormValues, value: string) => void,
) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (!name) return;
    handleChange(name as keyof CreateExpenseFormValues, value);
  };
}

function CreateExpenseFormFields({
  form,
  categories,
  budgets,
  variant,
  onCancelEdit,
}: {
  form: ReturnType<typeof useCreateExpenseForm>;
  categories: Category[];
  budgets: CategoryBudgetSnapshot[];
  variant: CreateExpenseFormVariant;
  onCancelEdit?: () => void;
}) {
  const noCategories = categories.length === 0;
  const onFieldChange = fieldChangeHandler(form.handleChange);
  const showOverBudgetWarning = form.budgetPreview?.isOverBudget === true;
  const savingsTransfer = buildSavingsTransferHint(budgets, form.budgetPreview);
  const showCancel =
    onCancelEdit != null && (variant === 'plain' || form.isEditing);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="expense-category" className={formLabelClassName}>
          Категория
        </label>
        <CategorySelect
          id="expense-category"
          value={form.values.category_id}
          onValueChange={(category_id) => {
            form.handleChange('category_id', category_id);
          }}
          categories={categories}
          placeholder={
            noCategories ? 'Нет категорий расходов' : 'Выберите категорию'
          }
          disabled={form.isBusy || noCategories}
        />
      </div>

      <MoneyInput
        id="expense-amount"
        label="Сумма"
        name="amount"
        autoFocus={!form.isEditing}
        placeholder="0"
        disabled={form.isBusy}
        {...bindMoneyAmountField(form.values.amount, (amount) =>
          form.handleChange('amount', amount),
        )}
      />

      <Input
        id="expense-description"
        label="Описание"
        name="description"
        type="text"
        autoComplete="off"
        placeholder="Продукты, такси…"
        value={form.values.description}
        onChange={onFieldChange}
        disabled={form.isBusy}
      />

      <DatePicker
        id="expense-date"
        label="Дата"
        value={form.values.date}
        onChange={(date) => {
          form.handleChange('date', date);
        }}
        disabled={form.isBusy}
      />

      {form.validationError ? (
        <p className="text-sm text-red">{form.validationError}</p>
      ) : null}
      {form.serverError ? (
        <p className="text-sm text-red">{form.serverError}</p>
      ) : null}

      <CreateExpenseFormActions
        budgetPreview={form.budgetPreview}
        showOverBudgetActions={showOverBudgetWarning}
        savingsTransfer={savingsTransfer}
        noCategories={noCategories}
        isBusy={form.isBusy}
        isRecording={form.isRecording}
        isTopUpPending={form.isTopUpPending}
        topUpError={form.topUpError}
        canTopUp={form.canQuickTopUp}
        onQuickTopUp={(amount) => void form.handleQuickTopUp(amount)}
        submitLabel={form.isEditing ? 'Сохранить' : 'Добавить расход'}
        onCancelEdit={showCancel ? onCancelEdit : undefined}
        staticPreview={variant === 'plain'}
      />
    </form>
  );
}

function CreateExpenseFormShell({
  variant,
  isEditing,
  className,
  children,
}: {
  variant: CreateExpenseFormVariant;
  isEditing: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (variant === 'plain') {
    return <div className={cn('w-full', className)}>{children}</div>;
  }

  return (
    <Card className={cn('h-fit w-full max-h-full', className)}>
      <CardHeader className="shrink-0">
        <CardTitle>
          {isEditing ? 'Редактировать расход' : 'Новый расход'}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function CreateExpenseForm({
  categories,
  budgets,
  incomes,
  allocations,
  selectedCategoryId,
  editingExpense = null,
  onCancelEdit,
  onComplete,
  onStressCategoryChange,
  variant = 'card',
  className,
}: CreateExpenseFormProps) {
  const form = useCreateExpenseForm({
    budgets,
    incomes,
    allocations,
    editingExpense,
    onComplete,
    onStressCategoryChange,
  });

  useSyncSelectedCategory(
    editingExpense ? undefined : selectedCategoryId,
    form.values.category_id,
    (categoryId) => form.handleChange('category_id', categoryId),
  );

  return (
    <CreateExpenseFormShell
      variant={variant}
      isEditing={form.isEditing}
      className={className}
    >
      <CreateExpenseFormFields
        form={form}
        categories={categories}
        budgets={budgets}
        variant={variant}
        onCancelEdit={onCancelEdit}
      />
    </CreateExpenseFormShell>
  );
}
