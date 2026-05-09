import { put, del } from "@vercel/blob";
import { env } from "@/lib/env";

export type UploadFolder = "products" | "churches" | "vendors";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadImage(
  file: File,
  folder: UploadFolder
): Promise<{ url: string; pathname: string }> {
  if (file.size > MAX_BYTES) throw new Error("Image too large (max 5 MB)");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Unsupported image type");
  if (!env.BLOB_READ_WRITE_TOKEN) {
    // Dev fallback when running without Blob configured: return a placeholder.
    // Real uploads require BLOB_READ_WRITE_TOKEN to be set.
    return { url: `/placeholder-${folder}.png`, pathname: `placeholder-${folder}.png` };
  }
  const ext = file.name.split(".").pop() || "bin";
  const safe = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const result = await put(safe, file, {
    access: "public",
    token: env.BLOB_READ_WRITE_TOKEN,
    contentType: file.type,
  });
  return { url: result.url, pathname: result.pathname };
}

export async function deleteImage(pathname: string): Promise<void> {
  if (!env.BLOB_READ_WRITE_TOKEN) return;
  await del(pathname, { token: env.BLOB_READ_WRITE_TOKEN });
}
