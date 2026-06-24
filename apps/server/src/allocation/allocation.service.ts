import { DEFAULT_ALLOCATION_TYPE, monthValueFromDate } from '@coffer/shared';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Income, Prisma } from '../generated/prisma/client';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { awaitBudgetProjection } from '../lib/budget-projection';
import { DEV_USER_ID } from '../lib/dev-user';
import { sumPrismaMoneyAmounts, toMoneyNumber } from '../lib/money';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@Injectable()
export class AllocationService {
  private readonly logger = new Logger(AllocationService.name);

  constructor(
    private prisma: PrismaService,
    private readonly budgetMonthService: BudgetMonthService,
    private readonly budgetProjector: BudgetProjectorService,
  ) {}

  private async requireIncome(incomeId: string): Promise<Income> {
    const income = await this.prisma.income.findUnique({
      where: { id: incomeId },
    });

    if (!income) {
      throw new BadRequestException('Income not found');
    }
    if (income.status !== 'RECEIVED') {
      throw new BadRequestException('Expected income cannot be allocated');
    }

    return income;
  }

  private async requireCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }

  private async assertAllocationFitsIncome(
    incomeId: string,
    incomeAmount: Prisma.Decimal,
    amount: number,
    excludeAllocationId?: string,
  ): Promise<void> {
    const allocations = await this.prisma.allocation.findMany({
      where: { income_id: incomeId },
    });

    const allocatedTotal = sumPrismaMoneyAmounts(
      excludeAllocationId
        ? allocations.filter((row) => row.id !== excludeAllocationId)
        : allocations,
    );

    if (allocatedTotal + amount > toMoneyNumber(incomeAmount.toString())) {
      throw new BadRequestException('Allocation exceeds income amount');
    }
  }

  async create(dto: CreateAllocationDto) {
    const income = await this.requireIncome(dto.income_id);

    await this.assertAllocationFitsIncome(
      dto.income_id,
      income.amount,
      dto.amount,
    );

    await this.budgetMonthService.ensurePeriodOpen(
      DEV_USER_ID,
      monthValueFromDate(income.period_month),
    );

    const allocation = await this.prisma.allocation.create({
      data: {
        // TODO убрать хардкод после добавления пользователей
        user_id: DEV_USER_ID,
        income_id: dto.income_id,
        category_id: dto.category_id,
        amount: dto.amount,
        type: DEFAULT_ALLOCATION_TYPE,
        period_month: income.period_month,
      },
    });

    await awaitBudgetProjection(
      this.logger,
      'allocation create',
      this.budgetProjector.onAllocationCreated(this.prisma, allocation),
    );

    return allocation;
  }

  async findAll(incomeId?: string) {
    const rows = await this.prisma.allocation.findMany({
      where: incomeId ? { income_id: incomeId } : undefined,
      orderBy: { created_at: 'desc' },
    });

    if (rows.length === 0) {
      return [];
    }

    const categoryIds = [...new Set(rows.map((row) => row.category_id))];
    const incomeIds = [...new Set(rows.map((row) => row.income_id))];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const incomes = await this.prisma.income.findMany({
      where: { id: { in: incomeIds } },
    });

    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const incomeById = new Map(incomes.map((income) => [income.id, income]));

    return rows.map((row) => {
      const category = categoryById.get(row.category_id);
      const income = incomeById.get(row.income_id);
      if (!category || !income) {
        throw new NotFoundException();
      }

      return { ...row, category, income };
    });
  }

  async update(id: string, dto: UpdateAllocationDto) {
    const beforeRow = await this.prisma.allocation.findUnique({
      where: { id },
    });

    if (!beforeRow) {
      throw new NotFoundException();
    }

    const beforeIncome = await this.requireIncome(beforeRow.income_id);

    const before = { ...beforeRow, income: beforeIncome };

    await this.requireCategory(dto.category_id);
    await this.assertAllocationFitsIncome(
      before.income_id,
      before.income.amount,
      dto.amount,
      id,
    );

    await this.budgetMonthService.ensurePeriodOpen(
      DEV_USER_ID,
      monthValueFromDate(before.period_month),
    );

    const afterRow = await this.prisma.allocation.update({
      where: { id },
      data: {
        category_id: dto.category_id,
        amount: dto.amount,
      },
    });

    const afterCategory = await this.prisma.category.findUnique({
      where: { id: afterRow.category_id },
    });
    const afterIncome = await this.prisma.income.findUnique({
      where: { id: afterRow.income_id },
    });
    if (!afterCategory || !afterIncome) {
      throw new NotFoundException();
    }

    const after = { ...afterRow, category: afterCategory, income: afterIncome };

    await awaitBudgetProjection(
      this.logger,
      'allocation update',
      this.budgetProjector.onAllocationUpdated(this.prisma, before, after),
    );

    return after;
  }
}
