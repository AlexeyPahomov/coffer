import { Module } from '@nestjs/common';

import { BudgetModule } from '../budget/budget.module';
import { PlannedExpenseController } from './planned-expense.controller';
import { PlannedExpenseService } from './planned-expense.service';

@Module({
  imports: [BudgetModule],
  controllers: [PlannedExpenseController],
  providers: [PlannedExpenseService],
  exports: [PlannedExpenseService],
})
export class PlannedExpenseModule {}
