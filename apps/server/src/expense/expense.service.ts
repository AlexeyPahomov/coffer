import {

  BadRequestException,

  Injectable,

  Logger,

  NotFoundException,

} from '@nestjs/common';

import { monthValueFromDate } from '@coffer/shared';

import { runBudgetProjection } from '../lib/budget-projection';

import { DEV_USER_ID } from '../lib/dev-user';

import { BudgetMonthService } from '../budget/budget-month.service';

import { BudgetProjectorService } from '../budget/budget-projector.service';

import { PrismaService } from '../prisma/prisma.service';

import { CreateExpenseDto } from './dto/create-expense.dto';

import { UpdateExpenseDto } from './dto/update-expense.dto';



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



    runBudgetProjection(

      this.logger,

      'create',

      this.budgetProjector.onExpenseCreated(this.prisma, expense),

    );



    return expense;

  }



  findAll() {

    return this.prisma.expense.findMany({

      include: {

        category: true,

      },

      orderBy: {

        date: 'desc',

      },

    });

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



    runBudgetProjection(

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

    runBudgetProjection(
      this.logger,
      'remove',
      this.budgetProjector.onExpenseRemoved(this.prisma, expense),
    );

    await this.prisma.expense.delete({ where: { id } });
  }

}


