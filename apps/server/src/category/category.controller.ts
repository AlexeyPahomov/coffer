import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../lib/current-user.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string) {
    return this.categoryService.findAll(userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, userId, dto);
  }
}
