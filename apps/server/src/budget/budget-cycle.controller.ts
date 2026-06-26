import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../lib/current-user.decorator';
import { BudgetCycleService } from './budget-cycle.service';
import type { BudgetCycleViewDto } from './budget-cycle.view.dto';

@Controller('budget-cycles')
export class BudgetCycleController {
  constructor(private readonly budgetCycleService: BudgetCycleService) {}

  @Get('current')
  getCurrent(
    @CurrentUser() userId: string,
    @Query('as_of') asOf: string | undefined,
  ): Promise<BudgetCycleViewDto> {
    return this.budgetCycleService.getCurrentView(userId, asOf);
  }
}
