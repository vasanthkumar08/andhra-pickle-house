export const PRODUCT_SLUGS = [
  'avakaya-pickle',
  'gongura-pickle',
  'tomato-pickle',
  'garlic-pickle',
  'lemon-pickle',
  'chicken-pickle',
] as const;

export const WEIGHT_OPTIONS = [
  { label: '250g', grams: 250, multiplier: 1 },
  { label: '500g', grams: 500, multiplier: 1.85 },
  { label: '1kg', grams: 1000, multiplier: 3.5 },
] as const;

export const OTP_LENGTH = 6;
export const ORDER_TOKEN_PREFIX = 'APH';
