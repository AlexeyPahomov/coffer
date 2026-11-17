import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePlannedEventDto } from './dto/create-planned-event.dto';
import { UpdatePlannedEventDto } from './dto/update-planned-event.dto';

@Injectable()
export class PlannedEventService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveTitle(title: string | undefined): string {
    const trimmed = title?.trim();
    if (!trimmed) {
      throw new BadRequestException('title is required');
    }
    return trimmed;
  }

  async assertOwned(id: string, userId: string) {
    const row = await this.prisma.plannedEvent.findFirst({
      where: { id, user_id: userId },
    });
    if (!row) {
      throw new NotFoundException('Planned event not found');
    }
    return row;
  }

  async create(userId: string, dto: CreatePlannedEventDto) {
    return this.prisma.plannedEvent.create({
      data: {
        user_id: userId,
        title: this.resolveTitle(dto.title),
        icon_name: dto.icon_name?.trim() || 'gift',
        icon_color: dto.icon_color?.trim() || 'purple',
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.plannedEvent.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    });
  }

  async update(id: string, userId: string, dto: UpdatePlannedEventDto) {
    await this.assertOwned(id, userId);

    return this.prisma.plannedEvent.update({
      where: { id },
      data: {
        title:
          dto.title === undefined ? undefined : this.resolveTitle(dto.title),
        icon_name: dto.icon_name?.trim() || undefined,
        icon_color: dto.icon_color?.trim() || undefined,
      },
    });
  }

  /** Планы события не удаляются — FK обнуляет их event_id. */
  async remove(id: string, userId: string): Promise<void> {
    await this.assertOwned(id, userId);
    await this.prisma.plannedEvent.delete({ where: { id } });
  }
}
