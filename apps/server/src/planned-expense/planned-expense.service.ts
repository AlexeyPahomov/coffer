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
import { withTransientDbRetry } from '../prisma/db-retry';
import { PrismaService } from '../prisma/prisma.service';
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
      },
    });
  }

  private async attachRelations(rows: PlannedExpenseRow[]) {
    if (rows.length === 0) {
      return [];
    }

    const categoryIds = [
      ...new Set(
        rows
          .map((row) => row.category_id)
          .filter((id): id is string => id != null),
      ),
    ];
    const budgetMonthIds = [...new Set(rows.map((row) => row.budget_month_id))];

    const categories =
      categoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
          })
        : [];
    const budgetMonths = await this.prisma.budgetMonth.findMany({
      where: { id: { in: budgetMonthIds } },
    });

    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const budgetMonthById = new Map(
      budgetMonths.map((budgetMonth) => [budgetMonth.id, budgetMonth]),
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
          void this.revertPlanToReserved(row.id, row.amount).catch(
            (error: unknown) => {
              this.logger.warn(
                'Failed to repair orphan completed planned expense',
                error instanceof Error ? error.stack : String(error),
              );
            },
          );
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

    const expense = await this.prisma.expense.create({
      data: {
        user_id: userId,
        category_id: categoryId,
        amount: dto.amount,
        description,
        date: expenseDate,
      },
    });

    const plannedExpense = await this.prisma.plannedExpense.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        reserved_amount: 0,
        amount: dto.amount,
        category_id: categoryId,
        completed_expense_id: expense.id,
      },
    });

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
