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
import { AllocationRuleService } from './allocation-rule.service';
import { ApplyAllocationRuleDto } from './dto/apply-allocation-rule.dto';
import { CreateAllocationRuleDto } from './dto/create-allocation-rule.dto';
import { UpdateAllocationRuleDto } from './dto/update-allocation-rule.dto';

@Controller('allocation-rules')
export class AllocationRuleController {
  constructor(private readonly allocationRuleService: AllocationRuleService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateAllocationRuleDto) {
    return this.allocationRuleService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string) {
    return this.allocationRuleService.findAll(userId);
  }

  @Get('preview')
  preview(
    @CurrentUser() userId: string,
    @Query('income_id') incomeId: string,
    @Query('rule_id') ruleId?: string,
  ) {
    return this.allocationRuleService.preview(userId, incomeId, ruleId);
  }

  @Post('apply')
  apply(@CurrentUser() userId: string, @Body() dto: ApplyAllocationRuleDto) {
    return this.allocationRuleService.apply(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateAllocationRuleDto,
  ) {
    return this.allocationRuleService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.allocationRuleService.remove(id, userId);
  }
}
