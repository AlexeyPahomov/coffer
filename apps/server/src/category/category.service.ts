import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isCarryOverPolicy,
  isCategoryIconKey,
  isCategoryType,
  isIconColorKey,
  resolveCarryOverPolicy,
} from '@coffer/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryFieldsDto } from './dto/category-fields.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  private validateFields(dto: CategoryFieldsDto): void {
    if (!isCategoryType(dto.type)) {
      throw new BadRequestException('Invalid category type');
    }
    if (!isCategoryIconKey(dto.icon)) {
      throw new BadRequestException('Invalid category icon');
    }
    if (!isIconColorKey(dto.icon_color)) {
      throw new BadRequestException('Invalid category icon color');
    }
    if (
      dto.carry_over_policy != null &&
      !isCarryOverPolicy(dto.carry_over_policy)
    ) {
      throw new BadRequestException('Invalid carry over policy');
    }
  }

  private toWriteData(dto: CategoryFieldsDto) {
    return {
      name: dto.name.trim(),
      type: dto.type,
      icon: dto.icon,
      icon_color: dto.icon_color,
      carry_over_policy: resolveCarryOverPolicy(
        dto.type,
        dto.carry_over_policy,
      ),
    };
  }

  create(dto: CreateCategoryDto) {
    this.validateFields(dto);

    return this.prisma.category.create({
      data: {
        // TODO убрать хардкод после добавления пользователей
        user_id: '00000000-0000-0000-0000-000000000001',
        ...this.toWriteData(dto),
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    this.validateFields(dto);

    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { id },
      data: this.toWriteData(dto),
    });
  }
}
