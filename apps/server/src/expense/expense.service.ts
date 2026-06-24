import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { monthValueFromDate } from '@coffer/shared';
import type { Prisma } from '../generated/prisma/client';

import { awaitBudgetProjection } from '../lib/budget-projection';
import { DEV_USER_ID } from '../lib/dev-user';
import { parsePeriodMonthKey } from '../lib/period-month';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

type ExpensePageOptions = {
  periodMonth?: string;
  categoryId?: string;
  cursor?: string;
  limit?: number;
};

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);

  constructor(
    private prisma: PrismaService,
    private readonly budgetMonthService: BudgetMonthService,
    private readonly budgetProjector: BudgetProjectorService,
  ) {}

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }

  private async findOwned(id: string, userId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, user_id: userId },
    });
    if (!expense) {
      throw new NotFoundException();
    }
    return expense;
  }

  private async attachCategories<
    T extends { category_id: string },
  >(rows: readonly T[]) {
    if (rows.length === 0) {
      return [];
    }

    const categoryIds = [...new Set(rows.map((row) => row.category_id))];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    return rows.map((row) => {
      const category = categoryById.get(row.category_id);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      return { ...row, category };
    });
  }

  private buildPageWhere(
    userId: string,
    options: ExpensePageOptions,
  ): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = { user_id: userId };

    if (options.periodMonth) {
      const parsed = parsePeriodMonthKey(options.periodMonth);
      if (!parsed) {
        throw new BadRequestException('Invalid period month');
      }
      where.date = {
        gte: new Date(parsed.year, parsed.month - 1, 1),
        lt: new Date(parsed.year, parsed.month, 1),
      };
    }

    if (options.categoryId) {
      where.category_id = options.categoryId;
    }

    return where;
  }

  async create(dto: CreateExpenseDto) {
    await this.assertCategoryExists(dto.category_id);

    const expenseDate = new Date(dto.date);
    await this.budgetMonthService.ensurePeriodOpen(
      DEV_USER_ID,
      monthValueFromDate(expenseDate),
    );

    const expense = await this.prisma.expense.create({
      data: {
        user_id: DEV_USER_ID,
        category_id: dto.category_id,
        amount: dto.amount,
        description: dto.description,
        date: expenseDate,
      },
    });

    await awaitBudgetProjection(
      this.logger,
      'create',
      this.budgetProjector.onExpenseCreated(this.prisma, expense),
    );

    return expense;
  }

  async findAll() {
    const rows = await this.prisma.expense.findMany({
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
    });

    return this.attachCategories(rows);
  }

  async findPage(userId: string, options: ExpensePageOptions) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const where = this.buildPageWhere(userId, options);

    const rows = await this.prisma.expense.findMany({
      where,
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(options.cursor
        ? {
            cursor: { id: options.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = await this.attachCategories(pageRows);

    return {
      items,
      nextCursor: hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null,
    };
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto) {
    const before = await this.findOwned(id, userId);
    await this.assertCategoryExists(dto.category_id);

    const expenseDate = new Date(dto.date);
    await this.budgetMonthService.ensurePeriodOpen(
      userId,
      monthValueFromDate(expenseDate),
    );
    if (before.date.getTime() !== expenseDate.getTime()) {
      await this.budgetMonthService.ensurePeriodOpen(
        userId,
        monthValueFromDate(before.date),
      );
    }

    const after = await this.prisma.expense.update({
      where: { id },
      data: {
        category_id: dto.category_id,
        amount: dto.amount,
        description: dto.description,
        date: expenseDate,
      },
    });

    await awaitBudgetProjection(
      this.logger,
      'update',
      this.budgetProjector.onExpenseUpdated(this.prisma, before, after),
    );

    return after;
  }

  async remove(id: string, userId: string): Promise<void> {
    const expense = await this.findOwned(id, userId);

    const linkedPlan = await this.prisma.plannedExpense.findFirst({
      where: { completed_expense_id: id, user_id: userId },
    });

    if (linkedPlan) {
      await this.prisma.plannedExpense.update({
        where: { id: linkedPlan.id },
        data: {
          status: 'RESERVED',
          reserved_amount: Number(linkedPlan.amount.toString()),
          completed_expense_id: null,
        },
      });
    }

    await awaitBudgetProjection(
      this.logger,
      'remove',
      this.budgetProjector.onExpenseRemoved(this.prisma, expense),
    );

    await this.prisma.expense.delete({ where: { id } });
  }
}
