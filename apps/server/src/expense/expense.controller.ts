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
import { DEV_USER_ID } from '../lib/dev-user';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expenseService.create(dto);
  }

  @Get()
  findAll(
    @Query('period_month') periodMonth: string | undefined,
    @Query('category_id') categoryId: string | undefined,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('user_id') userId: string | undefined,
  ) {
    const trimmedUserId = userId?.trim() || DEV_USER_ID;
    const hasPagination =
      periodMonth != null ||
      categoryId != null ||
      cursor != null ||
      limitRaw != null;

    if (!hasPagination) {
      return this.expenseService.findAll();
    }

    const limit = limitRaw ? Number(limitRaw) : undefined;
    if (limitRaw != null && (!Number.isFinite(limit) || limit! < 1)) {
      throw new BadRequestException('Invalid limit');
    }

    return this.expenseService.findPage(trimmedUserId, {
      periodMonth: periodMonth?.trim() || undefined,
      categoryId: categoryId?.trim() || undefined,
      cursor: cursor?.trim() || undefined,
      limit,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
    @Body() dto: UpdateExpenseDto,
  ) {
    const trimmedUserId = userId?.trim() ?? '';
    if (!trimmedUserId) {
      throw new BadRequestException('Query user_id is required');
    }
    return this.expenseService.update(id, trimmedUserId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
  ): Promise<void> {
    const trimmedUserId = userId?.trim() ?? '';
    if (!trimmedUserId) {
      throw new BadRequestException('Query user_id is required');
    }
    await this.expenseService.remove(id, trimmedUserId);
  }
}
