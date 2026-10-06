import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums';
import { UserDocument } from '../../modules/users/user.schema';

// Test-only: a low bcrypt cost keeps the in-memory smoke fast (never production).
const SMOKE_BCRYPT_ROUNDS = 4;

interface StoredUser {
  _id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  shopName?: string;
  refreshTokenHash?: string;
}

/**
 * In-memory stand-in for the User collection. Mirrors only the operations the
 * auth flow performs so the whole register → login journey can run over HTTP
 * without MongoDB (same pattern as `auth.integration.spec.ts`).
 */
export function createUserStore() {
  const store = new Map<string, StoredUser>();
  let sequence = 0;

  const nextId = (): string => {
    sequence += 1;
    // 24-char hex so the id is a valid Mongo ObjectId, like a real `_id`.
    return sequence.toString(16).padStart(24, '0');
  };

  const findByEmail = (email: string): StoredUser | undefined =>
    [...store.values()].find((user) => user.email === email.toLowerCase());

  return {
    usersService: createUsersService(store, nextId, findByEmail),
    userModel: createUserModel(store, findByEmail),
  };
}

/** UsersService double: create/findByEmail/findById as the auth flow calls them. */
function createUsersService(
  store: Map<string, StoredUser>,
  nextId: () => string,
  findByEmail: (email: string) => StoredUser | undefined,
) {
  return {
    create: async (input: {
      email: string;
      password: string;
      fullName: string;
    }): Promise<UserDocument> => {
      const user: StoredUser = {
        _id: nextId(),
        email: input.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, SMOKE_BCRYPT_ROUNDS),
        fullName: input.fullName,
        role: UserRole.CUSTOMER,
        isActive: true,
      };
      store.set(user._id, user);
      return user as unknown as UserDocument;
    },
    findByEmail: async (email: string) =>
      (findByEmail(email) ?? null) as unknown as UserDocument | null,
    findById: async (id: string) =>
      (store.get(id) ?? null) as unknown as UserDocument | null,
  };
}

/** User model double: exists / findById().select().exec() / findByIdAndUpdate. */
function createUserModel(
  store: Map<string, StoredUser>,
  findByEmail: (email: string) => StoredUser | undefined,
) {
  return {
    exists: async (filter: { email: string }) =>
      findByEmail(filter.email) ? { _id: filter.email } : null,
    findById: (id: string) => ({
      select: () => ({
        exec: async () =>
          (store.get(id) ?? null) as unknown as UserDocument | null,
      }),
    }),
    findByIdAndUpdate: (id: string, update: Record<string, unknown>) => ({
      exec: async () => {
        const user = store.get(id);
        if (!user) return null;
        if ('refreshTokenHash' in update) {
          user.refreshTokenHash = update.refreshTokenHash as string;
        }
        const unset = update.$unset as Record<string, unknown> | undefined;
        if (unset && 'refreshTokenHash' in unset) {
          delete user.refreshTokenHash;
        }
        return user as unknown as UserDocument;
      },
    }),
  };
}
