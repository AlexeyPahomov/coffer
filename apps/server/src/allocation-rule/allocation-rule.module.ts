import { Module } from '@nestjs/common';

import { BudgetModule } from '../budget/budget.module';
import { AllocationRuleController } from './allocation-rule.controller';
import { AllocationRuleService } from './allocation-rule.service';

@Module({
  imports: [BudgetModule],
  controllers: [AllocationRuleController],
  providers: [AllocationRuleService],
})
export class AllocationRuleModule {}
