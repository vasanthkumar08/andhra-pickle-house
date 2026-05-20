import { prisma } from '../lib/prisma';
import { productService } from './product.service';
import { NotFoundError, ValidationError } from '../lib/errors';

export class CartService {
  async getOrCreateCart(userId: string) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: {
        items: { include: { product: { include: { inventory: true } } } },
      },
    });
    return this.formatCart(cart);
  }

  private async formatCart(
    cart: NonNullable<Awaited<ReturnType<typeof this.getOrCreateCartRaw>>>
  ) {
    const products = await productService.listPublic();
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.weightGrams === item.weightGrams);
      const lineTotal = (variant?.priceInPaise ?? 0) * item.quantity;
      subtotal += lineTotal;
      return {
        id: item.id,
        productId: item.productId,
        slug: product?.slug,
        name: product?.name,
        nameTe: product?.nameTe,
        imageUrl: product?.imageUrl,
        weightGrams: item.weightGrams,
        weightLabel: variant?.label ?? `${item.weightGrams}g`,
        quantity: item.quantity,
        unitPrice: variant?.priceInPaise ?? 0,
        lineTotal,
        inStock: (variant?.stock ?? 0) >= item.quantity,
      };
    });
    return { id: cart.id, items, subtotal, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
  }

  private async getOrCreateCartRaw(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { inventory: true } } } } },
    });
  }

  async addItem(userId: string, productId: string, weightGrams: number, quantity: number) {
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { inventory: true },
    });
    if (!product) throw new NotFoundError('Product not found');

    const inv = product.inventory.find((i) => i.weightGrams === weightGrams);
    if (!inv || inv.stock - inv.reserved < quantity) {
      throw new ValidationError('Insufficient stock');
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.cartItem.upsert({
      where: {
        cartId_productId_weightGrams: {
          cartId: cart.id,
          productId,
          weightGrams,
        },
      },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, weightGrams, quantity },
    });

    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError('Cart not found');

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    } else {
      await prisma.cartItem.updateMany({
        where: { id: itemId, cartId: cart.id },
        data: { quantity },
      });
    }
    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getOrCreateCart(userId);
  }
}

export const cartService = new CartService();
