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

import { AllocationRuleService } from './allocation-rule.service';
import { ApplyAllocationRuleDto } from './dto/apply-allocation-rule.dto';
import { CreateAllocationRuleDto } from './dto/create-allocation-rule.dto';
import { UpdateAllocationRuleDto } from './dto/update-allocation-rule.dto';

@Controller('allocation-rules')
export class AllocationRuleController {
  constructor(private readonly allocationRuleService: AllocationRuleService) {}

  @Post()
  create(@Body() dto: CreateAllocationRuleDto) {
    return this.allocationRuleService.create(dto);
  }

  @Get()
  findAll() {
    return this.allocationRuleService.findAll();
  }

  @Get('preview')
  preview(
    @Query('income_id') incomeId: string,
    @Query('rule_id') ruleId?: string,
  ) {
    return this.allocationRuleService.preview(incomeId, ruleId);
  }

  @Post('apply')
  apply(@Body() dto: ApplyAllocationRuleDto) {
    return this.allocationRuleService.apply(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAllocationRuleDto) {
    return this.allocationRuleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.allocationRuleService.remove(id);
  }
}
