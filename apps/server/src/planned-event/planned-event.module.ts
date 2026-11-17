import { Module } from '@nestjs/common';

import { PlannedEventController } from './planned-event.controller';
import { PlannedEventService } from './planned-event.service';

@Module({
  controllers: [PlannedEventController],
  providers: [PlannedEventService],
  exports: [PlannedEventService],
})
export class PlannedEventModule {}
