import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { getCalendarDateKey, monthValueFromDate } from '@coffer/shared';

import { BootstrapService } from './bootstrap.service';
import type { AppBootstrapDto } from './bootstrap.view.dto';

@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  private resolveUserId(userId: string | undefined): string {
    const trimmed = userId?.trim() ?? '';
    if (!trimmed) {
      throw new BadRequestException('Query user_id is required');
    }
    return trimmed;
  }

  @Get()
  getBootstrap(
    @Query('user_id') userId: string | undefined,
    @Query('period_month') periodMonth: string | undefined,
    @Query('as_of') asOf: string | undefined,
  ): Promise<AppBootstrapDto> {
    const now = new Date();
    const defaultAsOf = getCalendarDateKey(now);
    if (!defaultAsOf) {
      throw new BadRequestException('Invalid default as_of date');
    }

    return this.bootstrapService.getBootstrap(
      this.resolveUserId(userId),
      periodMonth?.trim() || monthValueFromDate(now),
      asOf?.trim() || defaultAsOf,
    );
  }
}
