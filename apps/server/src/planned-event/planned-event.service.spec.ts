import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PlannedEventService } from './planned-event.service';

describe('PlannedEventService', () => {
  let service: PlannedEventService;
  type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  const asyncMock = () => jest.fn<(...args: unknown[]) => Promise<unknown>>();
  let prisma: {
    plannedEvent: {
      create: AsyncMock;
      findFirst: AsyncMock;
      update: AsyncMock;
      delete: AsyncMock;
    };
  };

  beforeEach(async () => {
    prisma = {
      plannedEvent: {
        create: asyncMock(),
        findFirst: asyncMock(),
        update: asyncMock(),
        delete: asyncMock(),
      },
    };
    prisma.plannedEvent.create.mockImplementation((args) =>
      Promise.resolve({ id: 'event-1', ...(args as { data: object }).data }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannedEventService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PlannedEventService);
  });

  it('создаёт событие с обрезанным названием и иконкой по умолчанию', async () => {
    await service.create('user-1', { title: '  Греция  ' });

    expect(prisma.plannedEvent.create).toHaveBeenCalledWith({
      data: {
        user_id: 'user-1',
        title: 'Греция',
        icon_name: 'gift',
        icon_color: 'purple',
      },
    });
  });

  it('отклоняет пустое название', async () => {
    await expect(
      service.create('user-1', { title: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('не удаляет чужое событие', async () => {
    prisma.plannedEvent.findFirst.mockResolvedValue(null);

    await expect(service.remove('event-1', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.plannedEvent.delete).not.toHaveBeenCalled();
  });

  it('удаляет своё событие', async () => {
    prisma.plannedEvent.findFirst.mockResolvedValue({ id: 'event-1' });

    await service.remove('event-1', 'user-1');

    expect(prisma.plannedEvent.delete).toHaveBeenCalledWith({
      where: { id: 'event-1' },
    });
  });
});
