import { Module } from '@nestjs/common';

import { AllocationRuleModule } from '../allocation-rule/allocation-rule.module';
import { AllocationModule } from '../allocation/allocation.module';
import { BudgetModule } from '../budget/budget.module';
import { CategoryModule } from '../category/category.module';
import { ExpenseModule } from '../expense/expense.module';
import { IncomeModule } from '../income/income.module';
import { PlannedExpenseModule } from '../planned-expense/planned-expense.module';

import { BootstrapController } from './bootstrap.controller';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [
    CategoryModule,
    IncomeModule,
    AllocationModule,
    ExpenseModule,
    PlannedExpenseModule,
    AllocationRuleModule,
    BudgetModule,
  ],
  controllers: [BootstrapController],
  providers: [BootstrapService],
})
export class BootstrapModule {}
