import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CATEGORY_NOT_FOUND_MESSAGE,
  CategoriesService,
  CategoryView,
} from './categories.service';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Category API (docs/API_SPEC.md): public reads + admin CRUD. `RolesGuard` runs
 * after the global auth guard; public routes carry no `@Roles` so they pass.
 */
@Controller('categories')
@UseGuards(RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  list(@Query() query: CategoryQueryDto): Promise<CategoryView[]> {
    return this.categoriesService.findAll(query);
  }

  @Public()
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<CategoryView> {
    const category = await this.categoriesService.findPublicById(id);
    if (!category) {
      throw new NotFoundException(CATEGORY_NOT_FOUND_MESSAGE);
    }
    return category;
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCategoryDto): Promise<CategoryView> {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryView> {
    const category = await this.categoriesService.update(id, dto);
    if (!category) {
      throw new NotFoundException(CATEGORY_NOT_FOUND_MESSAGE);
    }
    return category;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    const deleted = await this.categoriesService.remove(id);
    if (!deleted) {
      throw new NotFoundException(CATEGORY_NOT_FOUND_MESSAGE);
    }
    return { id };
  }
}
