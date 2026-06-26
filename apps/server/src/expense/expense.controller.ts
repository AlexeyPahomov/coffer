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
import { CurrentUser } from '../lib/current-user.decorator';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateExpenseDto) {
    return this.expenseService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() userId: string,
    @Query('period_month') periodMonth: string | undefined,
    @Query('category_id') categoryId: string | undefined,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limitRaw: string | undefined,
  ) {
    const hasPagination =
      periodMonth != null ||
      categoryId != null ||
      cursor != null ||
      limitRaw != null;

    if (!hasPagination) {
      return this.expenseService.findAll(userId);
    }

    const limit = limitRaw ? Number(limitRaw) : undefined;
    if (limitRaw != null && (!Number.isFinite(limit) || limit! < 1)) {
      throw new BadRequestException('Invalid limit');
    }

    return this.expenseService.findPage(userId, {
      periodMonth: periodMonth?.trim() || undefined,
      categoryId: categoryId?.trim() || undefined,
      cursor: cursor?.trim() || undefined,
      limit,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.expenseService.remove(id, userId);
  }
}
