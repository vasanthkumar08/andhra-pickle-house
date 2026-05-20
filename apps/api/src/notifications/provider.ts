export interface SendOtpInput {
  phone: string;
  code: string;
}

export interface SendOrderConfirmationInput {
  orderRef: string;
  customerPhone: string;
  customerName: string;
  totalPaise: number;
  verifyUrl: string;
  ownerMessage: string;
  customerMessage: string;
}

export interface NotificationProvider {
  sendOTP(input: SendOtpInput): Promise<void>;
  sendOrderConfirmation(input: SendOrderConfirmationInput): Promise<void>;
}
