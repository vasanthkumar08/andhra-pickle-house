import { env } from '../config/env';
import { logger } from '../lib/logger';
import type {
  NotificationProvider,
  SendOrderConfirmationInput,
  SendOtpInput,
} from './provider';

export class FallbackMockProvider implements NotificationProvider {
  private assertDevOnly() {
    if (!env.isDev && env.NODE_ENV !== 'test') {
      throw new Error('Fallback notification provider cannot be used outside development/test.');
    }
  }

  async sendOTP(input: SendOtpInput): Promise<void> {
    this.assertDevOnly();
    // Development/test only: the mock provider prints OTPs so local login can be completed without paid SMS.
    logger.info({ phone: input.phone, code: input.code }, 'Mock OTP sent');
  }

  async sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void> {
    this.assertDevOnly();
    logger.info(
      { orderRef: input.orderRef, customerPhone: input.customerPhone, ownerMessage: input.ownerMessage },
      'Mock order confirmation sent'
    );
  }
}
