import { Module } from '@nestjs/common';
import { BudgetModule } from '../budget/budget.module';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';

@Module({
  imports: [BudgetModule],
  controllers: [IncomeController],
  providers: [IncomeService],
})
export class IncomeModule {}
