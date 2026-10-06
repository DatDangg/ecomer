import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserRole } from '../../common/enums';
import { User, UserDocument } from './user.schema';

/** bcrypt cost factor. Kept in one place so hashing stays consistent everywhere. */
export const BCRYPT_SALT_ROUNDS = 10;

/** Hashes a plaintext password with bcrypt. */
export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/** Verifies a plaintext password against a bcrypt hash. */
export function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Fields accepted when creating a public account. `role` and `isActive` are
 * deliberately absent: they are server-controlled and must never come from a
 * request body (mass assignment — docs/PERMISSION.md guard order).
 */
export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
}

/**
 * Editable profile fields for `PATCH /users/me`. Kept explicit so the service
 * only ever writes these keys, regardless of what the controller passes.
 */
export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface UpdateShopInput {
  shopName: string;
  pickupAddress: string;
}

/** Profile shape returned to clients — never includes credential/token hashes. */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  shopName: string | null;
  pickupAddress: string | null;
}

/** Shop subset returned by `PATCH /users/me/shop`. */
export interface ShopInfo {
  shopName: string;
  pickupAddress: string | null;
}

/** Maps a user document to the client-facing profile contract. */
export function toUserProfile(user: UserDocument): UserProfile {
  return {
    id: String(user._id),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? null,
    address: user.address ?? null,
    role: user.role,
    shopName: user.shopName ?? null,
    pickupAddress: user.pickupAddress ?? null,
  };
}

/** Maps a user document to the shop info returned after a shop update. */
export function toShopInfo(user: UserDocument): ShopInfo {
  return {
    shopName: user.shopName ?? '',
    pickupAddress: user.pickupAddress ?? null,
  };
}

/**
 * Keeps only editable profile keys, defence-in-depth against mass assignment.
 * A runtime `typeof` guard (not just `!== undefined`) drops `null` too, so a
 * direct service call cannot blank a required field even if it bypasses the DTO.
 */
function pickProfileFields(input: UpdateProfileInput): Record<string, string> {
  const update: Record<string, string> = {};
  if (typeof input.fullName === 'string') update.fullName = input.fullName;
  if (typeof input.phone === 'string') update.phone = input.phone;
  if (typeof input.address === 'string') update.address = input.address;
  return update;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /** Loads a user including `passwordHash`; only call for credential checks. */
  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  /** Public registration: always creates an active `customer`. */
  async create(input: CreateUserInput): Promise<UserDocument> {
    const passwordHash = await hashPassword(input.password);
    return this.userModel.create({
      email: input.email.toLowerCase(),
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      address: input.address,
      role: UserRole.CUSTOMER,
      isActive: true,
    });
  }

  /**
   * Updates only the editable profile fields. An empty PATCH returns the
   * current document rather than issuing an empty `$set`, which MongoDB rejects.
   */
  async updateProfile(
    id: string,
    input: UpdateProfileInput,
  ): Promise<UserDocument | null> {
    const update = pickProfileFields(input);
    if (Object.keys(update).length === 0) {
      return this.findById(id);
    }
    return this.userModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
  }

  /** Sets the shop fields, which is what lets the account sell (BR-USR-002). */
  updateShop(id: string, input: UpdateShopInput): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            shopName: input.shopName,
            pickupAddress: input.pickupAddress,
          },
        },
        { new: true },
      )
      .exec();
  }
}
