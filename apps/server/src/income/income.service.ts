import {
  isIncomeStatus,
  resolveIncomeStatus,
  resolveIncomeType,
} from '@coffer/shared';
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

@Injectable()
export class IncomeService {
  constructor(
    private prisma: PrismaService,
    private readonly budgetMonthService: BudgetMonthService,
  ) {}

  create(dto: CreateIncomeDto): Promise<Income> {
    return this.prisma.income.create({
      data: {
        // TODO убрать хардкод после добавления пользователей
        user_id: '00000000-0000-0000-0000-000000000001',
        amount: dto.amount,
        source: dto.source,
        income_type: resolveIncomeType(dto.income_type),
        status: resolveIncomeStatus(dto.status),
        period_month: new Date(dto.period_month),
      },
    });
  }

  private resolveNextStatus(dto: UpdateIncomeDto, existing: Income) {
    if (dto.status === undefined) {
      return existing.status;
    }
    if (!isIncomeStatus(dto.status)) {
      throw new BadRequestException('Invalid income status');
    }
    return dto.status;
  }

  findAll(): Promise<Income[]> {
    return this.prisma.income.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: string, dto: UpdateIncomeDto): Promise<Income> {
    const existing = await this.prisma.income.findFirst({
      where: { id, user_id: dto.user_id },
    });
    if (!existing) {
      throw new NotFoundException();
    }

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

    const updated = await this.prisma.income.update({
      where: { id },
      data: {
        amount: dto.amount,
        source: dto.source,
        income_type: resolveIncomeType(dto.income_type),
        status: nextStatus,
        period_month: new Date(dto.period_month),
      },
    });

    if (existing.status !== updated.status && updated.status === 'RECEIVED') {
      const periodMonth = updated.period_month.toISOString().slice(0, 7);
      await this.budgetMonthService.rebuildFrom(updated.user_id, periodMonth);
    }

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.income.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) {
      throw new NotFoundException();
    }
    await this.prisma.allocation.deleteMany({ where: { income_id: id } });
    await this.prisma.income.delete({ where: { id } });
  }
}
