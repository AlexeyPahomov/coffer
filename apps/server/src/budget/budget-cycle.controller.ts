import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { BudgetCycleService } from './budget-cycle.service';
import type { BudgetCycleViewDto } from './budget-cycle.view.dto';

@Controller('budget-cycles')
export class BudgetCycleController {
  constructor(private readonly budgetCycleService: BudgetCycleService) {}

  private resolveUserId(userId: string | undefined): string {
    const trimmed = userId?.trim() ?? '';
    if (!trimmed) {
      throw new BadRequestException('Query user_id is required');
    }
    return trimmed;
  }

  @Get('current')
  getCurrent(
    @Query('user_id') userId: string | undefined,
    @Query('as_of') asOf: string | undefined,
  ): Promise<BudgetCycleViewDto> {
    return this.budgetCycleService.getCurrentView(
      this.resolveUserId(userId),
      asOf,
    );
  }
}
