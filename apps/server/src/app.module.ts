import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { IncomeModule } from './income/income.module';
import { AllocationModule } from './allocation/allocation.module';
import { CategoryModule } from './category/category.module';
import { ExpenseModule } from './expense/expense.module';
import { PlannedExpenseModule } from './planned-expense/planned-expense.module';
import { PlanningModule } from './planning/planning.module';
import { BudgetModule } from './budget/budget.module';
import { AllocationRuleModule } from './allocation-rule/allocation-rule.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { TransferModule } from './transfer/transfer.module';

@Module({
  imports: [
    PrismaModule,
    IncomeModule,
    AllocationModule,
    CategoryModule,
    ExpenseModule,
    PlannedExpenseModule,
    PlanningModule,
    BudgetModule,
    AllocationRuleModule,
    BootstrapModule,
    TransferModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
