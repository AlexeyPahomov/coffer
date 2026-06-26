import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { getCalendarDateKey, monthValueFromDate } from '@coffer/shared';

import { CurrentUser } from '../lib/current-user.decorator';
import { BootstrapService } from './bootstrap.service';
import type { AppBootstrapDto } from './bootstrap.view.dto';

@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get()
  getBootstrap(
    @CurrentUser() userId: string,
    @Query('period_month') periodMonth: string | undefined,
    @Query('as_of') asOf: string | undefined,
  ): Promise<AppBootstrapDto> {
    const now = new Date();
    const defaultAsOf = getCalendarDateKey(now);
    if (!defaultAsOf) {
      throw new BadRequestException('Invalid default as_of date');
    }

    return this.bootstrapService.getBootstrap(
      userId,
      periodMonth?.trim() || monthValueFromDate(now),
      asOf?.trim() || defaultAsOf,
    );
  }
}
