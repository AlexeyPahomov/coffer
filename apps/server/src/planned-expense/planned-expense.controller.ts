import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../lib/current-user.decorator';
import { PlannedExpenseService } from './planned-expense.service';
import { CreatePlannedExpenseDto } from './dto/create-planned-expense.dto';
import { FinishPlannedExpenseDto } from './dto/finish-planned-expense.dto';
import { UpdatePlannedExpenseDto } from './dto/update-planned-expense.dto';

@Controller('planned-expense')
export class PlannedExpenseController {
  constructor(private readonly plannedExpenseService: PlannedExpenseService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreatePlannedExpenseDto) {
    return this.plannedExpenseService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() userId: string,
    @Query('period') period: string | undefined,
  ) {
    return this.plannedExpenseService.findAll(
      userId,
      period?.trim() || undefined,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdatePlannedExpenseDto,
  ) {
    return this.plannedExpenseService.update(id, userId, dto);
  }

  @Post(':id/finish')
  finish(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: FinishPlannedExpenseDto,
  ) {
    return this.plannedExpenseService.finish(id, userId, dto);
  }

  @Post(':id/unfinish')
  unfinish(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.plannedExpenseService.unfinish(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.plannedExpenseService.remove(id, userId);
  }
}
