import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UserRole } from '../enums';

export type OwnerId = Types.ObjectId | string;

/** Compares ids across ObjectId/string representations. */
export function isSameId(left: OwnerId, right: OwnerId): boolean {
  return String(left) === String(right);
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Write-side ownership check (PATCH/DELETE resource by id). The resource must
 * belong to the caller or the caller must be an admin; otherwise 403.
 */
export function assertOwnerOrAdmin(
  user: AuthenticatedUser,
  ownerId: OwnerId,
): void {
  if (isAdmin(user) || isSameId(user.id, ownerId)) {
    return;
  }
  throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
}

/**
 * Read-side "mine" ownership check (`/orders/my/:id`, `/orders/selling/:id`).
 * Anything not owned by the caller returns 404 instead of 403 so the resource
 * existence is not leaked (BOLA/IDOR — docs/PERMISSION.md). Admins are not
 * special-cased here: admin reads go through dedicated `/admin/*` routes.
 */
export function assertOwnershipOrNotFound(
  user: AuthenticatedUser,
  ownerId: OwnerId,
): void {
  if (isSameId(user.id, ownerId)) {
    return;
  }
  throw new NotFoundException('Không tìm thấy tài nguyên');
}
