"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireVerifiedVendor } from "@/lib/auth/guards";
import { vendorProfileSchema, productSchema } from "@/lib/validation/vendor";
import { uniqueSlug } from "@/lib/format";
import { uploadImage, deleteImage } from "@/lib/storage";

type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

export async function upsertVendorProfileAction(_prev: Result, formData: FormData): Promise<Result> {
  const user = await requireRole("VENDOR");
  const parsed = vendorProfileSchema.safeParse({
    businessName: formData.get("businessName"),
    cacNumber: formData.get("cacNumber") || "",
    churchAffiliation: formData.get("churchAffiliation") || "",
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    description: formData.get("description") || "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const existing = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    // Edits to identity fields (name, CAC, address, phone) on a VERIFIED vendor
    // require re-review — defends against bait-and-switch where a verified
    // store mutates into a different business after approval.
    const identityChanged =
      existing.status === "VERIFIED" &&
      (existing.businessName !== parsed.data.businessName ||
        (existing.cacNumber || "") !== (parsed.data.cacNumber || "") ||
        existing.phone !== parsed.data.phone ||
        existing.address !== parsed.data.address ||
        existing.city !== parsed.data.city ||
        existing.state !== parsed.data.state);

    await prisma.vendorProfile.update({
      where: { userId: user.id },
      data: {
        ...parsed.data,
        ...(identityChanged ? { status: "PENDING", rejectionReason: null } : {}),
      },
    });
    revalidatePath("/vendor/settings");
    revalidatePath("/vendor/dashboard");
    return { ok: true };
  }
  await prisma.vendorProfile.create({
    data: {
      ...parsed.data,
      userId: user.id,
      slug: uniqueSlug(parsed.data.businessName),
    },
  });
  revalidatePath("/vendor/dashboard");
  redirect("/vendor/dashboard");
}

export async function createProductAction(_prev: Result, formData: FormData): Promise<Result> {
  const { vendor } = await requireVerifiedVendor();
  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priceNaira: formData.get("priceNaira"),
    inventoryQty: formData.get("inventoryQty"),
    categoryId: formData.get("categoryId"),
    available: formData.get("available") === "on",
    isDigital: formData.get("isDigital") === "on",
    weightGrams: formData.get("weightGrams") || null,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      weightGrams: parsed.data.weightGrams ?? null,
      vendorId: vendor.id,
      slug: uniqueSlug(parsed.data.title),
    },
  });

  // Optional image uploads
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 0) {
    const uploads = await Promise.all(
      files.slice(0, 8).map(async (f) => {
        try {
          return await uploadImage(f, "products");
        } catch {
          return null;
        }
      })
    );
    const valid = uploads.filter((u): u is { url: string; pathname: string } => !!u);
    if (valid.length > 0) {
      await prisma.productImage.createMany({
        data: valid.map((u, i) => ({
          productId: product.id,
          url: u.url,
          position: i,
        })),
      });
    }
  }

  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}

export async function updateProductAction(productId: string, _prev: Result, formData: FormData): Promise<Result> {
  const { vendor } = await requireVerifiedVendor();
  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priceNaira: formData.get("priceNaira"),
    inventoryQty: formData.get("inventoryQty"),
    categoryId: formData.get("categoryId"),
    available: formData.get("available") === "on",
    isDigital: formData.get("isDigital") === "on",
    weightGrams: formData.get("weightGrams") || null,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const product = await prisma.product.findFirst({ where: { id: productId, vendorId: vendor.id } });
  if (!product) return { error: "Product not found" };

  await prisma.product.update({
    where: { id: productId },
    data: { ...parsed.data, weightGrams: parsed.data.weightGrams ?? null },
  });
  revalidatePath("/vendor/products");
  return { ok: true };
}

/**
 * Refuses to hard-delete a product if any cart item or order item references it,
 * because the Prisma default `onDelete: Restrict` would throw and we'd want
 * the OrderItem snapshot to survive anyway. Falls back to a soft-hide via
 * `available: false`, which removes it from the marketplace and from new
 * carts but preserves order history.
 */
export async function deleteProductAction(productId: string) {
  const { vendor } = await requireVerifiedVendor();
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId: vendor.id },
    include: { _count: { select: { cartItems: true, orderItems: true } } },
  });
  if (!product) return { error: "Product not found" } as const;

  if (product._count.orderItems > 0) {
    // Hard-delete would orphan order history. Soft-hide instead.
    await prisma.product.update({
      where: { id: productId },
      data: { available: false },
    });
    revalidatePath("/vendor/products");
    return {
      ok: true,
      softHidden: true,
      message: "Product hidden from buyers; preserved on past orders.",
    } as const;
  }

  // Safe to hard-delete: also clear any cart items so buyers don't see ghost rows.
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ]);
  revalidatePath("/vendor/products");
  return { ok: true } as const;
}

export async function setProductAvailabilityAction(productId: string, available: boolean) {
  const { vendor } = await requireVerifiedVendor();
  const product = await prisma.product.findFirst({ where: { id: productId, vendorId: vendor.id } });
  if (!product) return { error: "Product not found" };
  await prisma.product.update({ where: { id: productId }, data: { available } });
  revalidatePath("/vendor/products");
  return { ok: true } as const;
}

const MAX_IMAGES_PER_PRODUCT = 8;

/**
 * Adds new images to an existing product. Caps total at 8.
 */
export async function addProductImagesAction(_prev: Result, formData: FormData): Promise<Result> {
  const { vendor } = await requireVerifiedVendor();
  const productId = formData.get("productId");
  if (typeof productId !== "string") return { error: "Missing product" };
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId: vendor.id },
    include: { _count: { select: { images: true } } },
  });
  if (!product) return { error: "Product not found" };
  const remaining = MAX_IMAGES_PER_PRODUCT - product._count.images;
  if (remaining <= 0) return { error: `Already at the ${MAX_IMAGES_PER_PRODUCT}-image limit.` };

  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, remaining);
  if (files.length === 0) return { error: "Pick at least one image" };

  const uploads = await Promise.all(
    files.map(async (f) => {
      try {
        return await uploadImage(f, "products");
      } catch (e) {
        return { error: e instanceof Error ? e.message : "upload failed" } as const;
      }
    })
  );
  const valid = uploads.filter(
    (u): u is { url: string; pathname: string } => !!u && !("error" in u)
  );
  if (valid.length === 0) return { error: "All uploads failed" };

  await prisma.productImage.createMany({
    data: valid.map((u, i) => ({
      productId: product.id,
      url: u.url,
      position: product._count.images + i,
    })),
  });
  revalidatePath(`/vendor/products/${productId}/edit`);
  revalidatePath(`/products/${product.slug}`);
  return { ok: true };
}

/**
 * Deletes a single product image, removing it from Vercel Blob too.
 */
export async function deleteProductImageAction(imageId: string) {
  const { vendor } = await requireVerifiedVendor();
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, product: { vendorId: vendor.id } },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!image) return { error: "Image not found" } as const;

  // Best-effort: try to extract a Vercel Blob pathname from the URL.
  // A real implementation would store pathname on ProductImage.
  try {
    const url = new URL(image.url);
    const pathname = url.pathname.replace(/^\//, "");
    if (pathname) await deleteImage(pathname);
  } catch {
    // ignored — if URL is not a Blob URL there is nothing to delete remotely.
  }

  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath(`/vendor/products/${image.product.id}/edit`);
  revalidatePath(`/products/${image.product.slug}`);
  return { ok: true } as const;
}
