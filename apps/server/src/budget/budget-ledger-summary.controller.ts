import { Controller, Get, Param } from '@nestjs/common';

import { CurrentUser } from '../lib/current-user.decorator';
import { BudgetLedgerSummaryService } from './budget-ledger-summary.service';
import type { PeriodLedgerSummaryDto } from './budget-ledger-summary.view.dto';

@Controller('budget-ledger-summary')
export class BudgetLedgerSummaryController {
  constructor(
    private readonly budgetLedgerSummaryService: BudgetLedgerSummaryService,
  ) {}

  @Get(':period')
  findOne(
    @Param('period') period: string,
    @CurrentUser() userId: string,
  ): Promise<PeriodLedgerSummaryDto> {
    return this.budgetLedgerSummaryService.computeForPeriod(
      userId,
      period.trim(),
    );
  }
}
