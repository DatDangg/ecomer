/**
 * Account role. There is intentionally no `seller` role: selling is determined
 * by ownership (`sellerId`), so every account can both buy and sell
 * (BR-AUTH-006, docs/ARCHITECTURE.md D1).
 */
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}
