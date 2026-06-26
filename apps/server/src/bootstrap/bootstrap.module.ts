import { Module } from '@nestjs/common';

import { AllocationRuleModule } from '../allocation-rule/allocation-rule.module';
import { BudgetModule } from '../budget/budget.module';
import { PlannedExpenseModule } from '../planned-expense/planned-expense.module';

import { BootstrapController } from './bootstrap.controller';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [PlannedExpenseModule, AllocationRuleModule, BudgetModule],
  controllers: [BootstrapController],
  providers: [BootstrapService],
})
export class BootstrapModule {}
