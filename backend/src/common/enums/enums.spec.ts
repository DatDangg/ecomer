import { BLOCK_REASON_SELLER_BANNED } from '../constants';
import {
  CancelledBy,
  CheckoutStatus,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from './index';

describe('shared enums', () => {
  it('matches the order status values from the tech conventions', () => {
    expect(Object.values(OrderStatus)).toEqual([
      'pending',
      'confirmed',
      'shipping',
      'delivered',
      'cancelled',
      'refunded',
    ]);
  });

  it('matches the payment status values', () => {
    expect(Object.values(PaymentStatus)).toEqual([
      'unpaid',
      'paid',
      'refunded',
    ]);
  });

  it('matches the checkout status values', () => {
    expect(Object.values(CheckoutStatus)).toEqual([
      'pending',
      'paid',
      'failed',
      'expired',
    ]);
  });

  it('matches the cancelledBy values', () => {
    expect(Object.values(CancelledBy)).toEqual(['system', 'seller', 'admin']);
  });

  it('has only customer/admin roles (no seller role)', () => {
    expect(Object.values(UserRole)).toEqual(['customer', 'admin']);
  });

  it('exposes the seller-banned block reason constant', () => {
    expect(BLOCK_REASON_SELLER_BANNED).toBe('seller_banned');
  });
});
