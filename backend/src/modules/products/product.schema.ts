import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { withBaseSchemaOptions } from '../../common/schemas/base.schema';

export type ProductDocument = HydratedDocument<Product>;

/** Business limit shared by the schema and request validation (R-04). */
export const PRODUCT_NAME_MAX_LENGTH = 120;

/**
 * Product owned by exactly one seller. `sellerId` is immutable, `slug` is
 * server-generated and `isBlocked` is admin-controlled, so none of them are
 * ever accepted from a request body (R-04 mass-assignment guard).
 *
 * Public visibility requires `isActive && !isBlocked`; the two flags stay
 * separate so a seller cannot re-enable a product an admin blocked
 * (project-ecommerce/05-database-erd.md).
 */
@Schema(withBaseSchemaOptions())
export class Product {
  /** Ref: `users` (docs/ERD.md). `immutable` keeps ownership fixed for life. */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
    index: true,
  })
  sellerId!: Types.ObjectId;

  /** Server-generated and globally unique; never comes from a request body. */
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug!: string;

  @Prop({ required: true, trim: true, maxlength: PRODUCT_NAME_MAX_LENGTH })
  name!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  /** Integer VNĐ, strictly positive (docs/ERD.md). */
  @Prop({
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'price must be an integer',
    },
  })
  price!: number;

  /** Integer, zero or more. `stock=0` is still listed (R-05 badge "Hết hàng"). */
  @Prop({
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'stock must be an integer',
    },
  })
  stock!: number;

  /** Cover image first (docs/ERD.md); URL validation is deferred (R-13). */
  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  })
  categoryId!: Types.ObjectId;

  /** Seller-visible flag, defaults to visible. */
  @Prop({ default: true })
  isActive!: boolean;

  /** Admin moderation flag, defaults to not blocked. */
  @Prop({ default: false })
  isBlocked!: boolean;

  @Prop({ trim: true })
  blockReason?: string;

  /** Populated by the base schema's `timestamps: true`; declared for typing. */
  createdAt!: Date;
  updatedAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Full-text search on the name (docs/ERD.md). `slug` unique comes from the
// prop, as do the `sellerId`/`categoryId` indexes; the remaining indexes are
// declared here because they are not tied to a single prop.
ProductSchema.index({ name: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1, isBlocked: 1 });
