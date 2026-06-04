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
import type { Income } from '../generated/prisma/client';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeService } from './income.service';

@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  private resolveUserId(userId: string | undefined): string {
    const trimmedUserId = userId?.trim() ?? '';
    if (!trimmedUserId) {
      throw new BadRequestException('Query user_id is required');
    }
    return trimmedUserId;
  }

  @Post()
  create(@Body() dto: CreateIncomeDto): Promise<Income> {
    return this.incomeService.create(dto);
  }

  @Get()
  findAll(): Promise<Income[]> {
    return this.incomeService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ): Promise<Income> {
    return this.incomeService.update(id, dto);
  }

  @Patch(':id/receive')
  receive(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
  ): Promise<Income> {
    return this.incomeService.receive(id, this.resolveUserId(userId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @Param('id') id: string,
    @Query('user_id') userId: string | undefined,
  ): Promise<void> {
    await this.incomeService.remove(id, this.resolveUserId(userId));
  }
}
