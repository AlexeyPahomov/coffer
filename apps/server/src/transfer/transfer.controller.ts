import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../lib/current-user.decorator';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferService } from './transfer.service';

@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateTransferDto) {
    return this.transferService.create(userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.transferService.remove(id, userId);
  }
}
