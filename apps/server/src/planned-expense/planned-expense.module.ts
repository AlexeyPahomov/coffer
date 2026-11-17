import { Module } from '@nestjs/common';

import { BudgetModule } from '../budget/budget.module';
import { PlannedEventModule } from '../planned-event/planned-event.module';
import { TransferModule } from '../transfer/transfer.module';
import { PlannedExpenseController } from './planned-expense.controller';
import { PlannedExpenseService } from './planned-expense.service';

@Module({
  imports: [BudgetModule, PlannedEventModule, TransferModule],
  controllers: [PlannedExpenseController],
  providers: [PlannedExpenseService],
  exports: [PlannedExpenseService],
})
export class PlannedExpenseModule {}
