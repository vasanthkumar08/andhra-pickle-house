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
    logger.info({ phone: input.phone, codeLength: input.code.length }, 'Mock OTP generated');
  }

  async sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void> {
    this.assertDevOnly();
    logger.info(
      { orderRef: input.orderRef, customerPhone: input.customerPhone, ownerMessage: input.ownerMessage },
      'Mock order confirmation sent'
    );
  }
}
