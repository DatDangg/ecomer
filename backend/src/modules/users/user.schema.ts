import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../common/enums';
import { withBaseSchemaOptions } from '../../common/schemas/base.schema';

export type UserDocument = HydratedDocument<User>;

/**
 * Account document. One account can both buy and sell: there is no `seller`
 * role, selling is derived from ownership (`sellerId`) once `shopName` and
 * `pickupAddress` are set (docs/PERMISSION.md, docs/ARCHITECTURE.md D1).
 *
 * Credential/token hashes are `select: false` so ordinary queries never load
 * them; the base schema also strips them from every JSON/object response.
 */
@Schema(withBaseSchemaOptions())
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
    index: true,
  })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop({ trim: true, minlength: 3, maxlength: 50 })
  shopName?: string;

  @Prop({ trim: true })
  pickupAddress?: string;

  /**
   * Populated by Mongoose `timestamps: true` (base schema options). `joinedAt`
   * in the public shop response is this value. Declared for typing only — no
   * `@Prop`, so Mongoose still owns the path.
   */
  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
