/** Payment state stored on each order (payment itself belongs to the checkout). */
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}
