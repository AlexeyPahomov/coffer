import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../lib/current-user.decorator';
import { BudgetMonthService } from './budget-month.service';

@Controller('budget-months')
export class BudgetMonthController {
  constructor(private readonly budgetMonthService: BudgetMonthService) {}

  @Get(':period')
  findOne(@Param('period') period: string, @CurrentUser() userId: string) {
    return this.budgetMonthService.getView(userId, period);
  }

  @Post(':period/open')
  @HttpCode(HttpStatus.OK)
  open(@Param('period') period: string, @CurrentUser() userId: string) {
    return this.budgetMonthService.open(userId, period);
  }

  @Post(':period/rebuild-from')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rebuildFrom(
    @Param('period') period: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.budgetMonthService.rebuildFrom(userId, period);
  }

  @Post(':period/close')
  @HttpCode(HttpStatus.OK)
  close(@Param('period') period: string, @CurrentUser() userId: string) {
    return this.budgetMonthService.close(userId, period);
  }
}
