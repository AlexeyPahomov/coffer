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
import { indexRelatedByIds } from '../lib/attach-relation';
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

  async create(userId: string, dto: CreateAllocationDto) {
    const income = await this.requireIncome(dto.income_id);

    await this.assertAllocationFitsIncome(
      dto.income_id,
      income.amount,
      dto.amount,
    );

    await this.budgetMonthService.ensurePeriodOpen(
      userId,
      monthValueFromDate(income.period_month),
    );

    const allocation = await this.prisma.allocation.create({
      data: {
        user_id: userId,
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

    const category = await this.prisma.category.findUnique({
      where: { id: allocation.category_id },
    });
    if (!category) {
      throw new NotFoundException();
    }

    return { ...allocation, category, income };
  }

  async findAll(userId: string, incomeId?: string) {
    const where: Prisma.AllocationWhereInput = { user_id: userId };
    if (incomeId) {
      where.income_id = incomeId;
    }

    const rows = await this.prisma.allocation.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const categoryById = await indexRelatedByIds(
      rows,
      (row) => row.category_id,
      (ids) => this.prisma.category.findMany({ where: { id: { in: ids } } }),
    );
    const incomeById = await indexRelatedByIds(
      rows,
      (row) => row.income_id,
      (ids) => this.prisma.income.findMany({ where: { id: { in: ids } } }),
    );

    return rows.map((row) => {
      const category = categoryById.get(row.category_id);
      const income = incomeById.get(row.income_id);
      if (!category || !income) {
        throw new NotFoundException();
      }

      return { ...row, category, income };
    });
  }

  async update(id: string, userId: string, dto: UpdateAllocationDto) {
    const beforeRow = await this.prisma.allocation.findFirst({
      where: { id, user_id: userId },
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
      userId,
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
