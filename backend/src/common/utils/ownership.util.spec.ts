import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UserRole } from '../enums';
import {
  assertOwnerOrAdmin,
  assertOwnershipOrNotFound,
  isSameId,
} from './ownership.util';

const owner: AuthenticatedUser = {
  id: 'user-1',
  email: 'owner@example.com',
  role: UserRole.CUSTOMER,
};
const other: AuthenticatedUser = {
  id: 'user-2',
  email: 'other@example.com',
  role: UserRole.CUSTOMER,
};
const admin: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
};

describe('isSameId', () => {
  it('compares an ObjectId with its string form', () => {
    const id = new Types.ObjectId();

    expect(isSameId(id, id.toHexString())).toBe(true);
    expect(isSameId(id, new Types.ObjectId().toHexString())).toBe(false);
  });
});

describe('assertOwnerOrAdmin (write side)', () => {
  it('allows the owner', () => {
    expect(() => assertOwnerOrAdmin(owner, owner.id)).not.toThrow();
  });

  it('allows an admin operating on someone else', () => {
    expect(() => assertOwnerOrAdmin(admin, other.id)).not.toThrow();
  });

  it('rejects a non-owner non-admin with 403', () => {
    expect(() => assertOwnerOrAdmin(other, owner.id)).toThrow(
      ForbiddenException,
    );
  });
});

describe('assertOwnershipOrNotFound (read "mine" side)', () => {
  it('allows the owner', () => {
    expect(() => assertOwnershipOrNotFound(owner, owner.id)).not.toThrow();
  });

  it('returns 404 for someone else, even an admin', () => {
    expect(() => assertOwnershipOrNotFound(other, owner.id)).toThrow(
      NotFoundException,
    );
    expect(() => assertOwnershipOrNotFound(admin, owner.id)).toThrow(
      NotFoundException,
    );
  });
});
