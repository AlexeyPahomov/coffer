import { Module } from '@nestjs/common';
import { BudgetCycleController } from './budget-cycle.controller';
import { BudgetCycleService } from './budget-cycle.service';
import { BudgetMonthController } from './budget-month.controller';
import { BudgetMonthService } from './budget-month.service';
import { BudgetProjectorService } from './budget-projector.service';
import { BudgetRebuildService } from './budget-rebuild.service';

@Module({
  controllers: [BudgetMonthController, BudgetCycleController],
  providers: [
    BudgetRebuildService,
    BudgetMonthService,
    BudgetProjectorService,
    BudgetCycleService,
  ],
  exports: [
    BudgetMonthService,
    BudgetProjectorService,
    BudgetRebuildService,
    BudgetCycleService,
  ],
})
export class BudgetModule {}
