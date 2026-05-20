import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    slug: 'avakaya-pickle',
    name: 'Avakaya Pickle',
    nameTe: 'ఆవకాయ',
    description: 'Sun-dried raw mangoes, cold-pressed sesame oil, and grandmother\'s spice blend — the crown jewel of Andhra kitchens.',
    imageUrl: 'https://images.unsplash.com/photo-1609501676725-7186f3e59e33?w=800&q=80',
    spiceLevel: 4,
    basePrice: 34900,
    weights: [250, 500, 1000],
    stock: [40, 35, 20],
  },
  {
    slug: 'gongura-pickle',
    name: 'Gongura Pickle',
    nameTe: 'గోంగూర',
    description: 'Tangy sorrel leaves slow-cooked with garlic and red chillies — a Telugu soul food classic.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51f25a64747?w=800&q=80',
    spiceLevel: 3,
    basePrice: 29900,
    weights: [250, 500, 1000],
    stock: [30, 28, 15],
  },
  {
    slug: 'tomato-pickle',
    name: 'Tomato Pickle',
    nameTe: 'టమాటా',
    description: 'Ripe tomatoes caramelized in spices — sweet, spicy, and impossibly addictive.',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    spiceLevel: 2,
    basePrice: 24900,
    weights: [250, 500, 1000],
    stock: [50, 40, 25],
  },
  {
    slug: 'garlic-pickle',
    name: 'Garlic Pickle',
    nameTe: 'వెల్లుల్లి',
    description: 'Whole garlic cloves marinated in fiery masala — bold, aromatic, unforgettable.',
    imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f126f?w=800&q=80',
    spiceLevel: 5,
    basePrice: 32900,
    weights: [250, 500, 1000],
    stock: [25, 20, 12],
  },
  {
    slug: 'lemon-pickle',
    name: 'Lemon Pickle',
    nameTe: 'నిమ్మకాయ',
    description: 'Tender lemons cured in salt and spices — bright, zesty, and deeply comforting.',
    imageUrl: 'https://images.unsplash.com/photo-1613476832884-a0996d1de03c?w=800&q=80',
    spiceLevel: 3,
    basePrice: 22900,
    weights: [250, 500, 1000],
    stock: [45, 38, 22],
  },
  {
    slug: 'chicken-pickle',
    name: 'Chicken Pickle',
    nameTe: 'కోడి',
    description: 'Tender chicken pieces in royal Andhra masala — a rare delicacy for true pickle connoisseurs.',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6451?w=800&q=80',
    spiceLevel: 4,
    basePrice: 44900,
    weights: [250, 500, 1000],
    stock: [15, 12, 8],
    featured: true,
    trending: true,
  },
  {
    slug: 'mango-pickle',
    name: 'Mango Pickle',
    nameTe: 'మామిడి',
    description: 'Classic Andhra mango pickle — tangy, bold, and sun-kissed.',
    imageUrl: 'https://images.unsplash.com/photo-1605027990121-c736661734de?w=800&q=80',
    spiceLevel: 3,
    basePrice: 27900,
    weights: [250, 500, 1000],
    stock: [35, 30, 18],
    featured: true,
  },
  {
    slug: 'prawn-pickle',
    name: 'Prawn Pickle',
    nameTe: 'రొయ్యల',
    description: 'Coastal Andhra prawns in fiery masala — a seafood lover\'s treasure.',
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b70302f7cee2?w=800&q=80',
    spiceLevel: 4,
    basePrice: 49900,
    weights: [250, 500],
    stock: [12, 10],
    trending: true,
  },
  {
    slug: 'amla-pickle',
    name: 'Amla Pickle',
    nameTe: 'ఉసిరి',
    description: 'Vitamin-rich gooseberry pickle — tangy, healthy, and deeply traditional.',
    imageUrl: 'https://images.unsplash.com/photo-1613476832884-a0996d1de03c?w=800&q=80',
    spiceLevel: 2,
    basePrice: 25900,
    weights: [250, 500, 1000],
    stock: [28, 22, 14],
  },
  {
    slug: 'tamarind-pickle',
    name: 'Tamarind Pickle',
    nameTe: 'చింతకాయ',
    description: 'Bold tamarind pulp with spices — sharp, sour, and irresistible.',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    spiceLevel: 3,
    basePrice: 23900,
    weights: [250, 500],
    stock: [32, 26],
  },
  {
    slug: 'mixed-veg-pickle',
    name: 'Mixed Veg Pickle',
    nameTe: 'మిశ్రమ',
    description: 'Seasonal vegetables in grandmother\'s spice blend — variety in every bite.',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
    spiceLevel: 3,
    basePrice: 26900,
    weights: [250, 500, 1000],
    stock: [40, 35, 20],
  },
  {
    slug: 'green-chilli-pickle',
    name: 'Green Chilli Pickle',
    nameTe: 'పచ్చి మిర్చి',
    description: 'Fiery green chillies stuffed with masala — for true spice warriors.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a0b4514a2f86?w=800&q=80',
    spiceLevel: 5,
    basePrice: 21900,
    weights: [250, 500],
    stock: [38, 30],
    trending: true,
  },
];

type SeedProduct = (typeof products)[number] & {
  featured?: boolean;
  trending?: boolean;
  ingredients?: string;
};

const testimonials = [
  {
    name: 'Lakshmi Devi',
    location: 'Vijayawada',
    reviewEn: 'Tastes exactly like my ammamma\'s avakaya. I cried after the first bite — pure nostalgia.',
    reviewTe: 'అమ్మమ్మ చేతి ఆవకాయ రుచి. మొదటి ముక్కతో కళ్ళు నీళ్లు వచ్చాయి.',
    rating: 5,
  },
  {
    name: 'Ravi Kumar',
    location: 'Hyderabad',
    reviewEn: 'Ordered gongura for my parents in USA. They said it\'s the best they\'ve had in 20 years abroad.',
    reviewTe: 'గోంగూర అమ్మాకి పంపించాను — 20 సంవత్సరాల తర్వాత అసలు రుచి అని చెప్పారు.',
    rating: 5,
  },
  {
    name: 'Priya Reddy',
    location: 'Bengaluru',
    reviewEn: 'Premium packaging, authentic taste. The garlic pickle is dangerously good.',
    reviewTe: 'ప్రీమియం ప్యాకేజింగ్, అసలు రుచి. వెల్లుల్లి పచ్చడి అదిరిపోతుంది.',
    rating: 5,
  },
  {
    name: 'Suresh Babu',
    location: 'Visakhapatnam',
    reviewEn: 'WhatsApp ordering was so easy. Got confirmation instantly. Family finished 500g in 3 days!',
    reviewTe: 'వాట్సాప్ ఆర్డర్ చాలా సులభం. 500g మూడు రోజుల్లో అయిపోయింది!',
    rating: 5,
  },
];

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: 'andhra-pickles' },
    update: {},
    create: {
      slug: 'andhra-pickles',
      name: 'Andhra Homemade Pickles',
      nameTe: 'ఆంధ్ర ఇంటి పచ్చళ్లు',
      description: 'Handcrafted Telugu family recipes',
    },
  });

  for (const [i, p] of (products as SeedProduct[]).entries()) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        featured: p.featured ?? false,
        trending: p.trending ?? false,
        ingredients: p.ingredients ?? 'Sun-dried produce, cold-pressed oil, hand-ground spices',
        rating: 4.8,
        reviewsCount: 42,
      },
      create: {
        slug: p.slug,
        name: p.name,
        nameTe: p.nameTe,
        description: p.description,
        imageUrl: p.imageUrl,
        spiceLevel: p.spiceLevel,
        basePrice: p.basePrice,
        sortOrder: i,
        categoryId: category.id,
        featured: p.featured ?? i < 3,
        trending: p.trending ?? i % 3 === 0,
        ingredients: 'Sun-dried produce, cold-pressed oil, hand-ground spices, rock salt',
        rating: 4.5 + (i % 5) * 0.1,
        reviewsCount: 20 + i * 3,
        videoUrl: p.slug === 'avakaya-pickle' ? '/videos/hero-first-frame.mp4' : undefined,
      },
    });

    const hasImage = await prisma.productImage.findFirst({
      where: { productId: product.id, sortOrder: 0 },
    });
    if (!hasImage) {
      await prisma.productImage.create({
        data: { productId: product.id, url: p.imageUrl, alt: p.name, sortOrder: 0 },
      });
    }

    for (let j = 0; j < p.weights.length; j++) {
      await prisma.inventory.upsert({
        where: {
          productId_weightGrams: {
            productId: product.id,
            weightGrams: p.weights[j],
          },
        },
        update: { stock: p.stock[j] },
        create: {
          productId: product.id,
          weightGrams: p.weights[j],
          stock: p.stock[j],
        },
      });
    }
  }

  for (const [i, t] of testimonials.entries()) {
    await prisma.testimonial.create({
      data: { ...t, sortOrder: i, isActive: true },
    });
  }

  const adminPhone = process.env.ADMIN_PHONE || '919876543210';
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: 'ADMIN', name: 'APH Admin' },
    create: { phone: adminPhone, role: 'ADMIN', name: 'APH Admin' },
  });

  const heroMedia = [
    { type: 'video', url: '/videos/hero-first-frame.mp4', section: 'hero', sortOrder: 0, alt: 'Raw mango preparation' },
    { type: 'video', url: '/videos/hero-middle-frame.mp4', section: 'hero', sortOrder: 1, alt: 'Spice mixing ritual' },
    { type: 'video', url: '/videos/hero-first-frame.mp4', section: 'preparation', sortOrder: 0, alt: 'Pickle preparation' },
    { type: 'video', url: '/videos/hero-middle-frame.mp4', section: 'story', sortOrder: 0, alt: 'Family kitchen story' },
  ];

  for (const m of heroMedia) {
    const existing = await prisma.mediaAsset.findFirst({
      where: { section: m.section, url: m.url, sortOrder: m.sortOrder },
    });
    if (!existing) {
      await prisma.mediaAsset.create({ data: m });
    }
  }

  console.log('Seed completed — 12 products, hero media assets');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
