import { Module } from '@nestjs/common';
import { BudgetModule } from '../budget/budget.module';
import { TransferModule } from '../transfer/transfer.module';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';

@Module({
  imports: [BudgetModule, TransferModule],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
