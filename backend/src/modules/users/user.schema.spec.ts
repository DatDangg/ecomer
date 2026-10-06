import { model } from 'mongoose';
import { UserRole } from '../../common/enums';
import { UserSchema } from './user.schema';

const UserModel = model('UserSchemaSpec', UserSchema);

describe('UserSchema', () => {
  it('defaults role to customer and isActive to true', () => {
    const user = new UserModel({
      email: 'user@example.com',
      passwordHash: 'hash',
      fullName: 'User',
    });

    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(user.isActive).toBe(true);
  });

  it('lowercases the email', () => {
    const user = new UserModel({
      email: 'Mixed@Example.COM',
      passwordHash: 'hash',
      fullName: 'User',
    });

    expect(user.email).toBe('mixed@example.com');
  });

  it('declares a unique index on email', () => {
    const emailIndex = UserSchema.indexes().find(
      ([fields]) => fields.email === 1,
    );

    expect(emailIndex?.[1]?.unique).toBe(true);
  });

  it('hides passwordHash, refreshTokenHash and __v in toJSON', () => {
    const user = new UserModel({
      email: 'user@example.com',
      passwordHash: 'secret-hash',
      refreshTokenHash: 'token-hash',
      fullName: 'User',
    });

    const json = user.toJSON() as Record<string, unknown>;

    expect(json.email).toBe('user@example.com');
    expect(json).not.toHaveProperty('passwordHash');
    expect(json).not.toHaveProperty('refreshTokenHash');
    expect(json).not.toHaveProperty('__v');
  });
});
