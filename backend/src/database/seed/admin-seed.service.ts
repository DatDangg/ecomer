import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '../../common/enums';
import { hashPassword } from '../../modules/users/users.service';
import { User, UserDocument } from '../../modules/users/user.schema';

const MONGO_DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY_CODE
  );
}

/**
 * Creates the first admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on startup
 * (BR-AUTH-004 — there is no API to assign roles). Idempotent: an existing
 * account is left untouched (password is never reset), and a duplicate-key
 * race is treated as already seeded.
 */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = (this.config.get<string>('adminEmail') ?? '')
      .trim()
      .toLowerCase();
    const password = this.config.get<string>('adminPassword') ?? '';

    if (!email || !password) {
      this.logger.log(
        'Admin seed skipped: ADMIN_EMAIL/ADMIN_PASSWORD not configured',
      );
      return;
    }

    await this.seedAdmin(email, password);
  }

  /** Exposed for tests; `onApplicationBootstrap` is the production entry point. */
  async seedAdmin(email: string, password: string): Promise<void> {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      this.logger.log(`Admin seed skipped: ${email} already exists`);
      return;
    }

    const passwordHash = await hashPassword(password);
    try {
      await this.userModel.create({
        email,
        passwordHash,
        fullName: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      });
      this.logger.log(`Admin account seeded: ${email}`);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        this.logger.log(
          `Admin seed skipped: ${email} was created concurrently`,
        );
        return;
      }
      throw error;
    }
  }
}
