import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import {
  ShopInfo,
  toShopInfo,
  toUserProfile,
  UserProfile,
  UsersService,
} from './users.service';

const USER_NOT_FOUND_MESSAGE = 'Không tìm thấy người dùng';

/** Self-service profile and shop endpoints; always scoped to the token's user. */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser('id') userId: string): Promise<UserProfile> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    }
    return toUserProfile(user);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const user = await this.usersService.updateProfile(userId, dto);
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    }
    return toUserProfile(user);
  }

  @Patch('me/shop')
  async updateShop(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateShopDto,
  ): Promise<ShopInfo> {
    const user = await this.usersService.updateShop(userId, dto);
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    }
    return toShopInfo(user);
  }
}
