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
} from '@nestjs/common';
import type { Income } from '../generated/prisma/client';
import { CurrentUser } from '../lib/current-user.decorator';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeService } from './income.service';

@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(
    @CurrentUser() userId: string,
    @Body() dto: CreateIncomeDto,
  ): Promise<Income> {
    return this.incomeService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string): Promise<Income[]> {
    return this.incomeService.findAll(userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateIncomeDto,
  ): Promise<Income> {
    return this.incomeService.update(id, userId, dto);
  }

  @Patch(':id/receive')
  receive(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<Income> {
    return this.incomeService.receive(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.incomeService.remove(id, userId);
  }
}
