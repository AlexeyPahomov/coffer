import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../lib/current-user.decorator';
import { AllocationService } from './allocation.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@Controller('allocation')
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateAllocationDto) {
    return this.allocationService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string, @Query('incomeId') incomeId?: string) {
    return this.allocationService.findAll(userId, incomeId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateAllocationDto,
  ) {
    return this.allocationService.update(id, userId, dto);
  }
}
