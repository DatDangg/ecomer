import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { PaginatedData } from '../../common/dto/pagination-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { QueryProductDto } from './dto/query-product.dto';
import {
  PRODUCT_NOT_FOUND_MESSAGE,
  ProductsService,
  ProductView,
} from './products.service';

/**
 * Public product browse API (docs/API_SPEC.md). Every route is guest-readable
 * (`@Public()`); seller CRUD, `/products/my`, moderation, upload and cart are
 * deferred (task-04 scope). `:id` stays last in case `/my` is added later.
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  list(@Query() query: QueryProductDto): Promise<PaginatedData<ProductView>> {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ProductView> {
    const product = await this.productsService.findPublicById(id);
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_MESSAGE);
    }
    return product;
  }
}
