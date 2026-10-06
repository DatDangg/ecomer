import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicShop, ShopsService } from './shops.service';

const SHOP_NOT_FOUND_MESSAGE = 'Không tìm thấy gian hàng';

/** Public shop profile, browsable by guests (docs/PERMISSION.md). */
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Public()
  @Get(':sellerId')
  async getShop(@Param('sellerId') sellerId: string): Promise<PublicShop> {
    const shop = await this.shopsService.findPublicShop(sellerId);
    if (!shop) {
      throw new NotFoundException(SHOP_NOT_FOUND_MESSAGE);
    }
    return shop;
  }
}
