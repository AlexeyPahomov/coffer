import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Income } from '../generated/prisma/client';
import { BudgetMonthService } from '../budget/budget-month.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

const DEFAULT_INCOME_TYPE = 'salary';
const INCOME_TYPES = new Set([
  'salary',
  'freelance',
  'interest',
  'cashback',
  'refund',
  'investment',
  'other',
]);

type IncomeStatusValue = 'RECEIVED' | 'EXPECTED';

const DEFAULT_INCOME_STATUS: IncomeStatusValue = 'RECEIVED';

function resolveDtoIncomeType(value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_INCOME_TYPE;
  }
  if (!INCOME_TYPES.has(value)) {
    throw new BadRequestException('Invalid income type');
  }
  return value;
}

function isPrismaIncomeStatus(value: string): value is IncomeStatusValue {
  return value === 'RECEIVED' || value === 'EXPECTED';
}

function resolveIncomeStatusValue(
  value: string | undefined,
): IncomeStatusValue {
  if (value === undefined) {
    return DEFAULT_INCOME_STATUS;
  }
  if (!isPrismaIncomeStatus(value)) {
    throw new BadRequestException('Invalid income status');
  }
  return value;
}

/** Ключ учётного месяца `YYYY-MM` из Prisma `DateTime` (локальный календарь). */
function periodMonthKeyFromPrismaDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

@Injectable()
export class IncomeService {
  constructor(
    private prisma: PrismaService,
    private readonly budgetMonthService: BudgetMonthService,
  ) {}

  create(dto: CreateIncomeDto): Promise<Income> {
    const status = resolveIncomeStatusValue(dto.status);
    return this.prisma.income.create({
      data: {
        // TODO убрать хардкод после добавления пользователей
        user_id: '00000000-0000-0000-0000-000000000001',
        amount: dto.amount,
        source: dto.source,
        income_type: resolveDtoIncomeType(dto.income_type),
        status,
        period_month: new Date(dto.period_month),
        received_at: status === 'RECEIVED' ? new Date() : null,
      },
    });
  }

  private resolveNextStatus(
    dto: UpdateIncomeDto,
    existing: Income,
  ): IncomeStatusValue {
    if (dto.status === undefined) {
      return resolveIncomeStatusValue(String(existing.status));
    }
    return resolveIncomeStatusValue(dto.status);
  }

  findAll(): Promise<Income[]> {
    return this.prisma.income.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  private async findOwned(id: string, userId: string): Promise<Income> {
    const income = await this.prisma.income.findFirst({
      where: { id, user_id: userId },
    });
    if (!income) {
      throw new NotFoundException();
    }
    return income;
  }

  async update(id: string, dto: UpdateIncomeDto): Promise<Income> {
    const existing = await this.findOwned(id, dto.user_id);

    const nextStatus = this.resolveNextStatus(dto, existing);
    if (nextStatus === 'EXPECTED') {
      const allocationCount = await this.prisma.allocation.count({
        where: { income_id: id },
      });
      if (allocationCount > 0) {
        throw new BadRequestException(
          'Income with allocations cannot be marked as expected',
        );
      }
    }

    const wasReceived = existing.status === 'RECEIVED';
    const updated = await this.prisma.income.update({
      where: { id },
      data: {
        amount: dto.amount,
        source: dto.source,
        income_type: resolveDtoIncomeType(dto.income_type),
        status: nextStatus,
        period_month: new Date(dto.period_month),
        received_at:
          nextStatus === 'RECEIVED' && !wasReceived
            ? new Date()
            : nextStatus === 'EXPECTED'
              ? null
              : undefined,
      },
    });

    if (existing.status !== updated.status && updated.status === 'RECEIVED') {
      await this.budgetMonthService.rebuildFrom(
        updated.user_id,
        periodMonthKeyFromPrismaDate(updated.period_month),
      );
    }

    return updated;
  }

  async receive(id: string, userId: string): Promise<Income> {
    const existing = await this.findOwned(id, userId);
    if (existing.status === 'RECEIVED') {
      return existing;
    }

    await this.prisma.allocation.deleteMany({ where: { income_id: id } });

    const updated = await this.prisma.income.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        received_at: new Date(),
      },
    });

    await this.budgetMonthService.rebuildFrom(
      updated.user_id,
      periodMonthKeyFromPrismaDate(updated.period_month),
    );

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOwned(id, userId);
    await this.prisma.allocation.deleteMany({ where: { income_id: id } });
    await this.prisma.income.delete({ where: { id } });
  }
}
