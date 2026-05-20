import twilio from 'twilio';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { recordError } from '../observability/metrics';
import type {
  NotificationProvider,
  SendOrderConfirmationInput,
  SendOtpInput,
} from './provider';

export class TwilioProvider implements NotificationProvider {
  private client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);

  async sendOTP(input: SendOtpInput): Promise<void> {
    await this.sendSms(input.phone, `Your Andhra Pickle House OTP is ${input.code}. It expires soon.`);
  }

  async sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void> {
    await this.sendSms(input.customerPhone, input.customerMessage);

    if (env.ADMIN_PHONE) {
      await this.sendSms(env.ADMIN_PHONE, input.ownerMessage);
    }

    if (env.TWILIO_WHATSAPP_FROM && env.ADMIN_PHONE) {
      try {
        await this.client.messages.create({
          from: `whatsapp:${env.TWILIO_WHATSAPP_FROM}`,
          to: `whatsapp:+${env.ADMIN_PHONE.replace(/\D/g, '')}`,
          body: input.ownerMessage,
        });
      } catch (error) {
        recordError({ code: 'TWILIO_WHATSAPP_FAILURE' });
        logger.error(
          {
            err: error,
            provider: 'twilio',
            operation: 'sendWhatsApp',
            orderRef: input.orderRef,
            recipientType: 'admin',
          },
          'Twilio WhatsApp send failed'
        );
        throw error;
      }
    }
  }

  private async sendSms(phone: string, body: string): Promise<void> {
    const to = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
    try {
      await this.client.messages.create({
        to,
        body,
        ...(env.TWILIO_MESSAGING_SERVICE_SID
          ? { messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID }
          : { from: env.TWILIO_FROM_PHONE }),
      });
    } catch (error) {
      recordError({ code: 'TWILIO_SMS_FAILURE' });
      logger.error(
        {
          err: error,
          provider: 'twilio',
          operation: 'sendSms',
          recipientSuffix: to.slice(-4),
          messageLength: body.length,
        },
        'Twilio SMS send failed'
      );
      throw error;
    }
  }
}
