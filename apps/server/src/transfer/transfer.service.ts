import { monthValueFromDate } from '@coffer/shared';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BudgetMonthService } from '../budget/budget-month.service';
import { BudgetProjectorService } from '../budget/budget-projector.service';
import { awaitBudgetProjection } from '../lib/budget-projection';
import { toMoneyNumber } from '../lib/money';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetMonthService: BudgetMonthService,
    private readonly budgetProjector: BudgetProjectorService,
  ) {}

  private async requireCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }

  /** Остаток конверта-источника = closing_balance его снапшота (0, если снапшота ещё нет). */
  private async sourceRemaining(
    budgetMonthId: string,
    categoryId: string,
  ): Promise<number> {
    const snapshot = await this.prisma.categoryMonthSnapshot.findUnique({
      where: {
        budget_month_id_category_id: {
          budget_month_id: budgetMonthId,
          category_id: categoryId,
        },
      },
    });
    return snapshot
      ? toMoneyNumber(snapshot.closing_balance.toString())
      : 0;
  }

  async create(userId: string, dto: CreateTransferDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }
    if (dto.to_category_id != null && dto.to_category_id === dto.from_category_id) {
      throw new BadRequestException('Source and target categories must differ');
    }

    await this.requireCategory(dto.from_category_id);
    if (dto.to_category_id != null) {
      await this.requireCategory(dto.to_category_id);
    }

    const periodDate = new Date(dto.period_month);
    const periodMonth = monthValueFromDate(periodDate);

    // Бросает, если месяц не открыт/закрыт — перевод нельзя класть в замороженный период.
    const budgetMonth = await this.budgetMonthService.requireOpenMonth(
      this.prisma,
      userId,
      periodMonth,
    );

    const remaining = await this.sourceRemaining(
      budgetMonth.id,
      dto.from_category_id,
    );
    if (dto.amount > remaining) {
      throw new BadRequestException('Insufficient funds in source envelope');
    }

    const transfer = await this.prisma.transfer.create({
      data: {
        user_id: userId,
        from_category_id: dto.from_category_id,
        to_category_id: dto.to_category_id ?? null,
        amount: dto.amount,
        period_month: periodDate,
      },
    });

    await awaitBudgetProjection(
      this.logger,
      'transfer create',
      this.budgetProjector.onTransferCreated(this.prisma, transfer),
    );

    return transfer;
  }

  async remove(id: string, userId: string) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, user_id: userId },
    });
    if (!transfer) {
      throw new NotFoundException();
    }

    // Откат проекции допустим только в открытом периоде (как и создание).
    await this.budgetMonthService.requireOpenMonth(
      this.prisma,
      userId,
      monthValueFromDate(transfer.period_month),
    );

    await this.prisma.transfer.delete({ where: { id } });

    await awaitBudgetProjection(
      this.logger,
      'transfer remove',
      this.budgetProjector.onTransferRemoved(this.prisma, transfer),
    );

    return transfer;
  }
}
