"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
    },
];
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
    for (const [i, p] of products.entries()) {
        const product = await prisma.product.upsert({
            where: { slug: p.slug },
            update: {},
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
            },
        });
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
    console.log('Seed completed');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
