"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";

export async function addToCartAction(productId: string, quantity = 1): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?from=/products`);
  if (user.role !== "BUYER") return { error: "Only buyers can add to cart" };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.available) return { error: "Product unavailable" };
  if (product.inventoryQty <= 0) return { error: "Sold out" };
  const qty = Math.max(1, Math.min(quantity, product.inventoryQty));

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: qty }, priceKobo: product.priceKobo },
    create: { cartId: cart.id, productId, quantity: qty, priceKobo: product.priceKobo },
  });

  revalidatePath("/cart");
  return { ok: true };
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  const user = await requireRole("BUYER");
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId: user.id } },
    include: { product: true },
  });
  if (!item) return { error: "Item not found" };
  const safeQty = Math.max(0, Math.min(quantity, item.product.inventoryQty));
  if (safeQty === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: safeQty } });
  }
  revalidatePath("/cart");
  return { ok: true } as const;
}

export async function removeCartItemAction(itemId: string) {
  const user = await requireRole("BUYER");
  await prisma.cartItem.deleteMany({ where: { id: itemId, cart: { userId: user.id } } });
  revalidatePath("/cart");
  return { ok: true } as const;
}

export async function clearCartAction() {
  const user = await requireRole("BUYER");
  await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
  revalidatePath("/cart");
  return { ok: true } as const;
}
