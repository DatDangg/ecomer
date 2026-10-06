import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { withBaseSchemaOptions } from '../../common/schemas/base.schema';

export type CategoryDocument = HydratedDocument<Category>;

/**
 * Shared product category (BR-CAT-005). `slug` is server-generated from `name`
 * and is never accepted from a request body; `name` and `slug` are globally
 * unique (BR-CAT-001, docs/ERD.md).
 */
@Schema(withBaseSchemaOptions())
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug!: string;

  /** Optional Cloudinary image URL (BR-CAT-004); contract field is `imageUrl`. */
  @Prop({ trim: true })
  imageUrl?: string;

  /** Public listing only shows active categories (R-03). */
  @Prop({ default: true, index: true })
  isActive!: boolean;

  /** Populated by the base schema's `timestamps: true`; declared for typing. */
  createdAt!: Date;
  updatedAt!: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
