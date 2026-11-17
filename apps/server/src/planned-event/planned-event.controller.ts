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

import { CurrentUser } from '../lib/current-user.decorator';
import { CreatePlannedEventDto } from './dto/create-planned-event.dto';
import { UpdatePlannedEventDto } from './dto/update-planned-event.dto';
import { PlannedEventService } from './planned-event.service';

@Controller('planned-event')
export class PlannedEventController {
  constructor(private readonly plannedEventService: PlannedEventService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreatePlannedEventDto) {
    return this.plannedEventService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string) {
    return this.plannedEventService.findAll(userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdatePlannedEventDto,
  ) {
    return this.plannedEventService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.plannedEventService.remove(id, userId);
  }
}
