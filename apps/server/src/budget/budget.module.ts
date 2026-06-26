import { Module } from '@nestjs/common';
import { BudgetCycleController } from './budget-cycle.controller';
import { BudgetCycleService } from './budget-cycle.service';
import { BudgetLedgerSummaryController } from './budget-ledger-summary.controller';
import { BudgetLedgerSummaryService } from './budget-ledger-summary.service';
import { BudgetMonthController } from './budget-month.controller';
import { BudgetMonthService } from './budget-month.service';
import { BudgetProjectorService } from './budget-projector.service';
import { BudgetRebuildService } from './budget-rebuild.service';

@Module({
  controllers: [
    BudgetMonthController,
    BudgetCycleController,
    BudgetLedgerSummaryController,
  ],
  providers: [
    BudgetRebuildService,
    BudgetMonthService,
    BudgetProjectorService,
    BudgetCycleService,
    BudgetLedgerSummaryService,
  ],
  exports: [
    BudgetMonthService,
    BudgetProjectorService,
    BudgetRebuildService,
    BudgetCycleService,
    BudgetLedgerSummaryService,
  ],
})
export class BudgetModule {}
