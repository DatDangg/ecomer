import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';

/**
 * Products collection name. Products are owned by the Product module (Layer 2);
 * counting through the raw collection here avoids depending on that module
 * before it exists (task-02 Notes).
 */
export const PRODUCTS_COLLECTION = 'products';

export interface PublicShop {
  sellerId: string;
  shopName: string;
  joinedAt: Date;
  productCount: number;
}

@Injectable()
export class ShopsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Public shop lookup. Returns `null` (rendered as 404) when the id is
   * malformed, the user does not exist, has not set a shop, or is banned
   * (`/shops/:sellerId` in docs/PERMISSION.md).
   */
  async findPublicShop(sellerId: string): Promise<PublicShop | null> {
    if (!Types.ObjectId.isValid(sellerId)) {
      return null;
    }

    const user = await this.userModel.findById(sellerId).exec();
    if (!user || !user.isActive || !user.shopName) {
      return null;
    }

    return {
      sellerId: String(user._id),
      shopName: user.shopName,
      joinedAt: user.createdAt,
      productCount: await this.countVisibleProducts(sellerId),
    };
  }

  /** Counts products a buyer can see: active and not blocked (R-05). */
  private countVisibleProducts(sellerId: string): Promise<number> {
    return this.connection.collection(PRODUCTS_COLLECTION).countDocuments({
      sellerId: new Types.ObjectId(sellerId),
      isActive: true,
      isBlocked: false,
    });
  }
}
