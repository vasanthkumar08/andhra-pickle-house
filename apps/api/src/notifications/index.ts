import { env } from '../config/env';
import { FallbackMockProvider } from './fallback-mock.provider';
import type { NotificationProvider } from './provider';
import { TwilioProvider } from './twilio.provider';

let provider: NotificationProvider | null = null;

export function getNotificationProvider(): NotificationProvider {
  if (provider) return provider;

  if (env.OTP_PROVIDER === 'twilio') {
    provider = new TwilioProvider();
    return provider;
  }

  if (env.OTP_PROVIDER === 'msg91') {
    throw new Error('MSG91 notification provider is not implemented.');
  }

  provider = new FallbackMockProvider();
  return provider;
}

export type {
  NotificationProvider,
  SendOrderConfirmationInput,
  SendOtpInput,
} from './provider';
