import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { BudgetLedgerSummaryService } from './budget-ledger-summary.service';
import type { PeriodLedgerSummaryDto } from './budget-ledger-summary.view.dto';

@Controller('budget-ledger-summary')
export class BudgetLedgerSummaryController {
  constructor(
    private readonly budgetLedgerSummaryService: BudgetLedgerSummaryService,
  ) {}

  private resolveUserId(userId: string | undefined): string {
    const trimmed = userId?.trim() ?? '';
    if (!trimmed) {
      throw new BadRequestException('Query user_id is required');
    }
    return trimmed;
  }

  @Get(':period')
  findOne(
    @Param('period') period: string,
    @Query('user_id') userId: string | undefined,
  ): Promise<PeriodLedgerSummaryDto> {
    return this.budgetLedgerSummaryService.computeForPeriod(
      this.resolveUserId(userId),
      period.trim(),
    );
  }
}
