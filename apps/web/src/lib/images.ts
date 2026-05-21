export const FALLBACK_PRODUCT_IMAGE =
  'https://images.pexels.com/photos/9164642/pexels-photo-9164642.jpeg?auto=compress&cs=tinysrgb&w=900';

export const STORY_IMAGES = {
  kitchen:
    'https://images.pexels.com/photos/32830296/pexels-photo-32830296.jpeg?auto=compress&cs=tinysrgb&w=1200',
  mangoes:
    'https://images.pexels.com/photos/12507086/pexels-photo-12507086.jpeg?auto=compress&cs=tinysrgb&w=900',
  chillies:
    'https://images.pexels.com/photos/5060367/pexels-photo-5060367.jpeg?auto=compress&cs=tinysrgb&w=900',
  mustard:
    'https://images.pexels.com/photos/5988321/pexels-photo-5988321.jpeg?auto=compress&cs=tinysrgb&w=900',
  oil:
    'https://images.pexels.com/photos/5496350/pexels-photo-5496350.jpeg?auto=compress&cs=tinysrgb&w=900',
};

const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  'avakaya-pickle':
    'https://images.pexels.com/photos/9164642/pexels-photo-9164642.jpeg?auto=compress&cs=tinysrgb&w=900',
  'mango-pickle':
    'https://images.pexels.com/photos/7812134/pexels-photo-7812134.jpeg?auto=compress&cs=tinysrgb&w=900',
  'gongura-pickle':
    'https://images.pexels.com/photos/5410417/pexels-photo-5410417.jpeg?auto=compress&cs=tinysrgb&w=900',
  'tomato-pickle':
    'https://images.pexels.com/photos/5379435/pexels-photo-5379435.jpeg?auto=compress&cs=tinysrgb&w=900',
  'garlic-pickle':
    'https://images.pexels.com/photos/5379435/pexels-photo-5379435.jpeg?auto=compress&cs=tinysrgb&w=900',
  'lemon-pickle':
    'https://images.pexels.com/photos/9164642/pexels-photo-9164642.jpeg?auto=compress&cs=tinysrgb&w=900',
  'chicken-pickle':
    'https://images.pexels.com/photos/35267279/pexels-photo-35267279.jpeg?auto=compress&cs=tinysrgb&w=900',
  'prawn-pickle':
    'https://images.pexels.com/photos/35267279/pexels-photo-35267279.jpeg?auto=compress&cs=tinysrgb&w=900',
  'amla-pickle':
    'https://images.pexels.com/photos/7812134/pexels-photo-7812134.jpeg?auto=compress&cs=tinysrgb&w=900',
  'tamarind-pickle':
    'https://images.pexels.com/photos/5410417/pexels-photo-5410417.jpeg?auto=compress&cs=tinysrgb&w=900',
  'mixed-veg-pickle':
    'https://images.pexels.com/photos/9164642/pexels-photo-9164642.jpeg?auto=compress&cs=tinysrgb&w=900',
  'green-chilli-pickle':
    'https://images.pexels.com/photos/5379435/pexels-photo-5379435.jpeg?auto=compress&cs=tinysrgb&w=900',
};

export function productImageUrl(slug?: string | null, value?: string | null) {
  if (slug && PRODUCT_IMAGE_FALLBACKS[slug]) return PRODUCT_IMAGE_FALLBACKS[slug];
  return safeImageUrl(value);
}

export function safeImageUrl(value?: string | null) {
  if (!value) return FALLBACK_PRODUCT_IMAGE;

  const normalized = value.trim();
  if (
    normalized === 'image' ||
    normalized === '/image' ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('data:')
  ) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  return normalized;
}
