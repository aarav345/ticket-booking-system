import { logger } from '../../common/logger/logger';

export class PaymentService {
  /**
   * Simulate payment processing
   * In production, this would integrate with Stripe/PayPal
   *
   * @param amount - Amount to charge
   * @returns Promise<boolean> - Success or failure
   */
  async processPayment(amount: number): Promise<boolean> {
    logger.info({ amount }, 'Processing payment');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      logger.info({ amount }, 'Payment successful');
    } else {
      logger.warn({ amount }, 'Payment failed');
    }

    return success;
  }
}

export const paymentService = new PaymentService();
