import {
  BadRequestException,
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

import { PlannedExpenseService } from './planned-expense.service';
import { CreatePlannedExpenseDto } from './dto/create-planned-expense.dto';
import { FinishPlannedExpenseDto } from './dto/finish-planned-expense.dto';
import { UpdatePlannedExpenseDto } from './dto/update-planned-expense.dto';

function requireUserId(userId: string | undefined): string {
  const trimmed = userId?.trim() ?? '';
  if (!trimmed) {
    throw new BadRequestException('Query user_id is required');
  }
  return trimmed;
}

@Controller('planned-expense')
export class PlannedExpenseController {
  constructor(private readonly plannedExpenseService: PlannedExpenseService) {}

  @Post()
  create(@Body() dto: CreatePlannedExpenseDto) {
    return this.plannedExpenseService.create(dto);
  }

  @Get()
  findAll(@Query('period') period: string | undefined) {
    return this.plannedExpenseService.findAll(period?.trim() || undefined);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
    @Body() dto: UpdatePlannedExpenseDto,
  ) {
    return this.plannedExpenseService.update(id, requireUserId(userId), dto);
  }

  @Post(':id/finish')
  finish(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
    @Body() dto: FinishPlannedExpenseDto,
  ) {
    return this.plannedExpenseService.finish(id, requireUserId(userId), dto);
  }

  @Post(':id/unfinish')
  unfinish(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
  ) {
    return this.plannedExpenseService.unfinish(id, requireUserId(userId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
  ): Promise<void> {
    await this.plannedExpenseService.remove(id, requireUserId(userId));
  }
}
