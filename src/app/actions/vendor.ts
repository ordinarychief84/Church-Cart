"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireVerifiedVendor } from "@/lib/auth/guards";
import { vendorProfileSchema, productSchema } from "@/lib/validation/vendor";
import { uniqueSlug } from "@/lib/format";
import { uploadImage } from "@/lib/storage";

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
    await prisma.vendorProfile.update({
      where: { userId: user.id },
      data: { ...parsed.data },
    });
  } else {
    await prisma.vendorProfile.create({
      data: {
        ...parsed.data,
        userId: user.id,
        slug: uniqueSlug(parsed.data.businessName),
      },
    });
  }
  revalidatePath("/vendor/settings");
  return { ok: true };
}

export async function createProductAction(_prev: Result, formData: FormData): Promise<Result> {
  const { vendor } = await requireVerifiedVendor();
  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priceKobo: formData.get("priceKobo"),
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
    priceKobo: formData.get("priceKobo"),
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

export async function deleteProductAction(productId: string) {
  const { vendor } = await requireVerifiedVendor();
  await prisma.product.deleteMany({ where: { id: productId, vendorId: vendor.id } });
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
