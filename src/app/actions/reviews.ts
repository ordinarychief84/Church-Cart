"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().max(2000).optional().or(z.literal("")),
});

export async function submitReviewAction(_prev: { error?: string }, formData: FormData) {
  const user = await requireRole("BUYER");
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    body: formData.get("body") || "",
  });
  if (!parsed.success) return { error: "Invalid input" };

  // Allow only if buyer has completed an order with this product
  const hasCompletedOrder = await prisma.order.findFirst({
    where: {
      buyerId: user.id,
      status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] },
      items: { some: { productId: parsed.data.productId } },
    },
  });
  if (!hasCompletedOrder) return { error: "You can only review products you have received." };

  await prisma.review.upsert({
    where: { productId_authorId: { productId: parsed.data.productId, authorId: user.id } },
    create: {
      productId: parsed.data.productId,
      authorId: user.id,
      rating: parsed.data.rating,
      body: parsed.data.body || null,
    },
    update: { rating: parsed.data.rating, body: parsed.data.body || null },
  });
  revalidatePath(`/products`);
  return { ok: true } as const;
}
