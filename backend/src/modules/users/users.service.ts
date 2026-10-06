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
}
