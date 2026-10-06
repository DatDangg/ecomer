/** State of one checkout = one VNPay transaction that groups N orders. */
export enum CheckoutStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
}
