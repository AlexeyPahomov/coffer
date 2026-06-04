import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BudgetMonthService } from './budget-month.service';

@Controller('budget-months')
export class BudgetMonthController {
  constructor(private readonly budgetMonthService: BudgetMonthService) {}

  private resolveUserId(userId: string | undefined): string {
    const trimmed = userId?.trim() ?? '';
    if (!trimmed) {
      throw new BadRequestException('Query user_id is required');
    }
    return trimmed;
  }

  @Get(':period')
  findOne(
    @Param('period') period: string,
    @Query('user_id') userId: string | undefined,
  ) {
    return this.budgetMonthService.getView(
      this.resolveUserId(userId),
      period,
    );
  }

  @Post(':period/open')
  @HttpCode(HttpStatus.OK)
  open(
    @Param('period') period: string,
    @Query('user_id') userId: string | undefined,
  ) {
    return this.budgetMonthService.open(this.resolveUserId(userId), period);
  }

  @Post(':period/rebuild-from')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rebuildFrom(
    @Param('period') period: string,
    @Query('user_id') userId: string | undefined,
  ): Promise<void> {
    await this.budgetMonthService.rebuildFrom(this.resolveUserId(userId), period);
  }

  @Post(':period/close')
  @HttpCode(HttpStatus.OK)
  close(
    @Param('period') period: string,
    @Query('user_id') userId: string | undefined,
  ) {
    return this.budgetMonthService.close(this.resolveUserId(userId), period);
  }
}
