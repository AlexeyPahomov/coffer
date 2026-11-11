import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { monthValueFromDate, parsePeriodMonthKey } from '@coffer/shared';

import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { awaitBudgetProjection } from '../lib/budget-projection';
import { indexRelatedByIds } from '../lib/attach-relation';
import { toMoneyNumber } from '../lib/money';
import { withTransientDbRetry } from '../prisma/db-retry';
import { PrismaService } from '../prisma/prisma.service';
import { TransferService } from '../transfer/transfer.service';
import { CreatePlannedExpenseDto } from './dto/create-planned-expense.dto';
import { FinishPlannedExpenseDto } from './dto/finish-planned-expense.dto';
import { UpdatePlannedExpenseDto } from './dto/update-planned-expense.dto';
import {
  assertPlannedDateRange,
  dateKeyFromUtcDate,
  parseOptionalIsoDate,
  didPlannedDateEndChange,
} from './planned-expense-dates';

type PlannedExpenseRow = Awaited<
  ReturnType<PrismaService['plannedExpense']['findMany']>
>[number];

@Injectable()
export class PlannedExpenseService {
  private readonly logger = new Logger(PlannedExpenseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetMonthService: BudgetMonthService,
    private readonly budgetProjector: BudgetProjectorService,
    private readonly transferService: TransferService,
  ) {}

  private parsePeriodOrThrow(periodMonth: string) {
    const parsed = parsePeriodMonthKey(periodMonth);
    if (!parsed) {
      throw new BadRequestException('Invalid period month');
    }
    return parsed;
  }

  private async assertCategoryExists(categoryId: string | undefined) {
    if (!categoryId) {
      return;
    }
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }

  /** Доля из накоплений: 0 ≤ savings_amount ≤ amount, источник — конверт накоплений. */
  private async resolveSavingsSplit(
    amount: number,
    savingsCategoryId: string | null,
    savingsAmount: number,
    categoryId: string | null,
  ): Promise<{ savings_category_id: string | null; savings_amount: number }> {
    if (savingsAmount < 0 || savingsAmount > amount) {
      throw new BadRequestException(
        'savings_amount must be between 0 and amount',
      );
    }
    // Без конверта (в т.ч. удалён — FK обнулил id) доли нет.
    if (savingsAmount === 0 || !savingsCategoryId) {
      return { savings_category_id: null, savings_amount: 0 };
    }
    if (savingsCategoryId === categoryId) {
      throw new BadRequestException(
        'savings_category_id must differ from category_id',
      );
    }

    const category = await this.prisma.category.findUnique({
      where: { id: savingsCategoryId },
    });
    if (!category || category.type !== 'savings') {
      throw new BadRequestException('Savings category not found');
    }

    return {
      savings_category_id: savingsCategoryId,
      savings_amount: savingsAmount,
    };
  }

  private async resolveBudgetMonthId(
    userId: string,
    periodMonth: string,
  ): Promise<string> {
    await this.budgetMonthService.ensurePeriodOpen(userId, periodMonth);

    const { year, month } = this.parsePeriodOrThrow(periodMonth);

    const row = await this.prisma.budgetMonth.findUnique({
      where: {
        user_id_year_month: {
          user_id: userId,
          year,
          month,
        },
      },
    });

    if (!row) {
      throw new BadRequestException('Budget month not found');
    }

    return row.id;
  }

  private async findOwned(id: string, userId: string) {
    const row = await this.prisma.plannedExpense.findFirst({
      where: { id, user_id: userId },
    });
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  private async removeCompletedTransfer(
    plan: { completed_transfer_id: string | null },
    userId: string,
  ): Promise<void> {
    if (plan.completed_transfer_id) {
      await this.transferService.remove(plan.completed_transfer_id, userId);
    }
  }

  /** Сначала план → RESERVED, потом удаление расхода (иначе остаётся COMPLETED при обрыве после DELETE). */
  private async revertPlanToReserved(
    planId: string,
    amount: { toString(): string },
  ) {
    const reserved = Number(amount.toString());
    return this.prisma.plannedExpense.update({
      where: { id: planId },
      data: {
        status: 'RESERVED',
        reserved_amount: reserved,
        completed_expense_id: null,
        completed_transfer_id: null,
      },
    });
  }

  private async attachRelations(rows: PlannedExpenseRow[]) {
    const categoryById = await indexRelatedByIds(
      rows,
      (row) => row.category_id,
      (ids) => this.prisma.category.findMany({ where: { id: { in: ids } } }),
    );
    const budgetMonthById = await indexRelatedByIds(
      rows,
      (row) => row.budget_month_id,
      (ids) => this.prisma.budgetMonth.findMany({ where: { id: { in: ids } } }),
    );

    return rows.map((row) => {
      const budgetMonth = budgetMonthById.get(row.budget_month_id);
      if (!budgetMonth) {
        throw new NotFoundException('Budget month not found');
      }

      return {
        ...row,
        category: row.category_id
          ? (categoryById.get(row.category_id) ?? null)
          : null,
        budgetMonth,
      };
    });
  }

  private async findWithRelations(id: string, userId: string) {
    const row = await this.prisma.plannedExpense.findFirst({
      where: { id, user_id: userId },
    });
    if (!row) {
      throw new NotFoundException();
    }
    const [withRelations] = await this.attachRelations([row]);
    return withRelations;
  }

  async create(userId: string, dto: CreatePlannedExpenseDto) {
    await this.assertCategoryExists(dto.category_id);

    const plannedDate = new Date(dto.planned_date);
    const plannedDateEnd = parseOptionalIsoDate(dto.planned_date_end);
    assertPlannedDateRange(plannedDate, plannedDateEnd);
    const periodMonth = monthValueFromDate(plannedDate);
    const budgetMonthId = await this.resolveBudgetMonthId(userId, periodMonth);
    const savingsSplit = await this.resolveSavingsSplit(
      dto.amount,
      dto.savings_category_id ?? null,
      dto.savings_amount ?? 0,
      dto.category_id ?? null,
    );

    const created = await this.prisma.plannedExpense.create({
      data: {
        user_id: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        icon_name: dto.icon_name?.trim() || 'gift',
        icon_color: dto.icon_color?.trim() || 'purple',
        amount: dto.amount,
        planned_date: plannedDate,
        planned_date_end: plannedDateEnd,
        category_id: dto.category_id ?? null,
        ...savingsSplit,
        budget_month_id: budgetMonthId,
      },
    });

    const [withRelations] = await this.attachRelations([created]);
    return withRelations;
  }

  async findAll(userId: string, periodMonth?: string) {
    const where: {
      user_id: string;
      budgetMonth?: { year: number; month: number };
    } = { user_id: userId };

    if (periodMonth) {
      const { year, month } = this.parsePeriodOrThrow(periodMonth);
      where.budgetMonth = { year, month };
    }

    return withTransientDbRetry(async () => {
      const rows = await this.prisma.plannedExpense.findMany({
        where,
        orderBy: [{ planned_date: 'asc' }, { created_at: 'asc' }],
      });

      for (const row of rows) {
        if (row.status === 'COMPLETED' && row.completed_expense_id == null) {
          // Расход удалён вручную — возвращаем и долю, переведённую из накоплений.
          void this.removeCompletedTransfer(row, userId)
            .then(() => this.revertPlanToReserved(row.id, row.amount))
            .catch((error: unknown) => {
              this.logger.warn(
                'Failed to repair orphan completed planned expense',
                error instanceof Error ? error.stack : String(error),
              );
            });
          row.status = 'RESERVED';
          row.reserved_amount = row.amount;
        }
      }

      return this.attachRelations(rows);
    });
  }

  private resolveReservedAmount(
    amount: number,
    reservedAmount: number | undefined,
    status: string | undefined,
    beforeReserved: number,
  ): number {
    let next = reservedAmount !== undefined ? reservedAmount : beforeReserved;

    if (status === 'RESERVED' && reservedAmount === undefined) {
      next = amount;
    }

    if (next < 0 || next > amount) {
      throw new BadRequestException(
        'reserved_amount must be between 0 and amount',
      );
    }

    return next;
  }

  async update(id: string, userId: string, dto: UpdatePlannedExpenseDto) {
    const before = await this.findOwned(id, userId);

    if (dto.category_id !== undefined) {
      await this.assertCategoryExists(dto.category_id ?? undefined);
    }

    const amount =
      dto.amount !== undefined ? dto.amount : Number(before.amount.toString());

    const hasPlannedDateInDto =
      dto.planned_date !== undefined && dto.planned_date !== '';
    const plannedDate = hasPlannedDateInDto
      ? new Date(dto.planned_date!)
      : before.planned_date;
    const hasPlannedDateEndInDto = dto.planned_date_end !== undefined;
    const plannedDateEnd = hasPlannedDateEndInDto
      ? parseOptionalIsoDate(dto.planned_date_end)
      : before.planned_date_end;
    assertPlannedDateRange(plannedDate, plannedDateEnd);
    const plannedDateEndChanged =
      hasPlannedDateEndInDto &&
      didPlannedDateEndChange(plannedDateEnd, before.planned_date_end);
    const plannedDateChanged =
      hasPlannedDateInDto &&
      dto.planned_date!.trim().slice(0, 10) !==
        dateKeyFromUtcDate(before.planned_date);
    const periodChanged =
      plannedDateChanged &&
      monthValueFromDate(plannedDate) !==
        monthValueFromDate(before.planned_date);

    let budgetMonthId = before.budget_month_id;

    if (periodChanged) {
      const targetPeriodMonth = monthValueFromDate(plannedDate);
      budgetMonthId = await this.resolveBudgetMonthId(
        userId,
        targetPeriodMonth,
      );
    }

    const reservedAmount = this.resolveReservedAmount(
      amount,
      dto.reserved_amount,
      dto.status,
      Number(before.reserved_amount.toString()),
    );

    // Разбивку проверяем, только если её затрагивает запрос: смена статуса или
    // резерва не должна падать на устаревшем конверте накоплений.
    const touchesSavingsSplit =
      dto.amount !== undefined ||
      dto.category_id !== undefined ||
      dto.savings_category_id !== undefined ||
      dto.savings_amount !== undefined;
    // У проведённого плана перевод из накоплений уже сделан — разбивку не меняем.
    const changesSavingsSplit =
      (dto.savings_category_id !== undefined &&
        dto.savings_category_id !== before.savings_category_id) ||
      (dto.savings_amount !== undefined &&
        dto.savings_amount !== toMoneyNumber(before.savings_amount.toString()));
    if (before.status === 'COMPLETED' && changesSavingsSplit) {
      throw new BadRequestException(
        'Cannot change savings split of a completed planned expense',
      );
    }
    const savingsSplit = touchesSavingsSplit
      ? await this.resolveSavingsSplit(
          amount,
          dto.savings_category_id !== undefined
            ? dto.savings_category_id
            : before.savings_category_id,
          dto.savings_amount !== undefined
            ? dto.savings_amount
            : toMoneyNumber(before.savings_amount.toString()),
          dto.category_id !== undefined ? dto.category_id : before.category_id,
        )
      : {};

    await this.prisma.plannedExpense.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : dto.description?.trim() || null,
        icon_name: dto.icon_name?.trim(),
        icon_color: dto.icon_color?.trim(),
        amount: dto.amount,
        reserved_amount: reservedAmount,
        planned_date: plannedDateChanged ? plannedDate : undefined,
        planned_date_end: plannedDateEndChanged ? plannedDateEnd : undefined,
        status: dto.status,
        category_id:
          dto.category_id === undefined ? undefined : dto.category_id,
        ...savingsSplit,
        budget_month_id: periodChanged ? budgetMonthId : undefined,
      },
    });

    return this.findWithRelations(id, userId);
  }

  private assertCanFinish(plan: {
    status: string;
    reserved_amount: { toString(): string };
  }): void {
    if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
      throw new BadRequestException('Planned expense is already closed');
    }

    const reservedAmount = Number(plan.reserved_amount.toString());
    if (reservedAmount <= 0 && plan.status !== 'RESERVED') {
      throw new BadRequestException('Nothing reserved to finish');
    }
  }

  private resolveFinishCategoryId(
    dto: FinishPlannedExpenseDto,
    plan: { category_id: string | null },
  ): string {
    const categoryId = dto.category_id?.trim() || plan.category_id;
    if (!categoryId) {
      throw new BadRequestException('category_id is required');
    }
    return categoryId;
  }

  private resolveFinishDescription(
    dto: FinishPlannedExpenseDto,
    plan: { description: string | null },
  ): string | undefined {
    return dto.description?.trim() || plan.description?.trim() || undefined;
  }

  async finish(id: string, userId: string, dto: FinishPlannedExpenseDto) {
    const plan = await this.findOwned(id, userId);
    this.assertCanFinish(plan);

    if (dto.amount <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    const categoryId = this.resolveFinishCategoryId(dto, plan);

    const budgetMonth = await this.prisma.budgetMonth.findUnique({
      where: { id: plan.budget_month_id },
    });
    if (!budgetMonth || budgetMonth.status !== 'OPEN') {
      throw new ConflictException('Budget month is not open');
    }

    const expenseDate = new Date(dto.date);
    const expensePeriodMonth = monthValueFromDate(expenseDate);
    const planPeriodMonth = `${budgetMonth.year}-${String(budgetMonth.month).padStart(2, '0')}`;

    if (expensePeriodMonth !== planPeriodMonth) {
      await this.budgetMonthService.ensurePeriodOpen(
        userId,
        expensePeriodMonth,
      );
    }

    const description = this.resolveFinishDescription(dto, plan);

    // Доля из накоплений переводится в конверт расхода до самого расхода:
    // нехватка в накоплениях отклоняет проведение, ничего не создав, а сбой
    // следующих шагов откатывает перевод (интерактивных транзакций нет).
    const savingsPart = Math.min(
      toMoneyNumber(plan.savings_amount.toString()),
      dto.amount,
    );
    // Расход прямо в конверт накоплений и так списывается с него — перевод не нужен.
    const transfer =
      plan.savings_category_id &&
      plan.savings_category_id !== categoryId &&
      savingsPart > 0
        ? await this.transferService.create(userId, {
            from_category_id: plan.savings_category_id,
            to_category_id: categoryId,
            amount: savingsPart,
            period_month: `${expensePeriodMonth}-01`,
          })
        : null;

    let expense:
      | Awaited<ReturnType<PrismaService['expense']['create']>>
      | undefined;
    let plannedExpense: Awaited<
      ReturnType<PrismaService['plannedExpense']['update']>
    >;
    try {
      expense = await this.prisma.expense.create({
        data: {
          user_id: userId,
          category_id: categoryId,
          amount: dto.amount,
          description,
          date: expenseDate,
        },
      });

      plannedExpense = await this.prisma.plannedExpense.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          reserved_amount: 0,
          amount: dto.amount,
          category_id: categoryId,
          completed_expense_id: expense.id,
          completed_transfer_id: transfer?.id ?? null,
        },
      });
    } catch (error) {
      // Проекция по расходу ещё не запускалась — его можно просто удалить.
      if (expense) {
        await this.prisma.expense
          .delete({ where: { id: expense.id } })
          .catch((rollbackError: unknown) => {
            this.logger.error(
              `Failed to roll back expense ${expense?.id} after finish failure`,
              rollbackError instanceof Error
                ? rollbackError.stack
                : String(rollbackError),
            );
          });
      }
      if (transfer) {
        await this.transferService
          .remove(transfer.id, userId)
          .catch((rollbackError: unknown) => {
            this.logger.error(
              `Failed to roll back transfer ${transfer.id} after finish failure`,
              rollbackError instanceof Error
                ? rollbackError.stack
                : String(rollbackError),
            );
          });
      }
      throw error;
    }

    await awaitBudgetProjection(
      this.logger,
      'planned expense finish',
      this.budgetProjector.onExpenseCreated(this.prisma, expense),
    );

    return {
      expense,
      plannedExpense,
    };
  }

  async unfinish(id: string, userId: string) {
    const plan = await this.findOwned(id, userId);

    if (plan.status !== 'COMPLETED') {
      throw new BadRequestException('Planned expense is not completed');
    }

    const budgetMonth = await this.prisma.budgetMonth.findUnique({
      where: { id: plan.budget_month_id },
    });
    if (!budgetMonth || budgetMonth.status !== 'OPEN') {
      throw new ConflictException('Budget month is not open');
    }

    await this.removeCompletedTransfer(plan, userId);

    if (!plan.completed_expense_id) {
      return this.revertPlanToReserved(id, plan.amount);
    }

    const expense = await this.prisma.expense.findFirst({
      where: { id: plan.completed_expense_id, user_id: userId },
    });

    const plannedExpense = await this.revertPlanToReserved(id, plan.amount);

    if (expense) {
      await awaitBudgetProjection(
        this.logger,
        'planned expense unfinish',
        this.budgetProjector.onExpenseRemoved(this.prisma, expense),
      );

      await this.prisma.expense.delete({ where: { id: expense.id } });
    }

    return plannedExpense;
  }

  async remove(id: string, userId: string): Promise<void> {
    const plan = await this.findOwned(id, userId);

    if (plan.status !== 'PLANNED') {
      throw new BadRequestException(
        'Only planned expenses in PLANNED status can be deleted',
      );
    }

    await this.prisma.plannedExpense.delete({ where: { id } });
  }
}
