import { prisma } from '../lib/prisma';
import { productService } from './product.service';
import { NotFoundError } from '../lib/errors';

export class WishlistService {
  async list(userId: string) {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { inventory: true, images: { take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    });
    const products = await productService.listPublic();
    return items.map((item) => {
      const mapped = products.find((p) => p.id === item.productId);
      return { id: item.id, productId: item.productId, product: mapped, createdAt: item.createdAt };
    });
  }

  async add(userId: string, productId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) throw new NotFoundError('Product not found');

    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
    return item;
  }

  async remove(userId: string, productId: string) {
    await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  }
}

export const wishlistService = new WishlistService();
