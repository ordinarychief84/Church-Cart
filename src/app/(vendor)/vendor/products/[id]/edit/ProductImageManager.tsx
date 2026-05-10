"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { ImagePlus, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { addProductImagesAction, deleteProductImageAction } from "@/app/actions/vendor";

const initial = {} as { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

function UploadBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Uploading…" : "Upload images"}
    </Button>
  );
}

export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: { id: string; url: string; alt: string | null }[];
}) {
  const [state, action] = useFormState(addProductImagesAction, initial);
  const router = useRouter();
  const [deleting, startDelete] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);

  const remove = (imageId: string) =>
    startDelete(async () => {
      setDelError(null);
      const r = await deleteProductImageAction(imageId);
      if ("error" in r && r.error) setDelError(r.error);
      else router.refresh();
    });

  const remaining = Math.max(0, 8 - images.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Photos</h2>
            <p className="text-xs text-slate-500">
              Up to 8 images, max 5 MB each. JPEG, PNG, or WEBP. The first image is the cover.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {images.length}/8 used
          </span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {images.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No images yet. Add some so buyers can see what they&apos;re buying.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <li key={img.id} className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-brand-700/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  disabled={deleting}
                  aria-label="Remove image"
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-red-600 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {delError && <p className="text-sm text-red-600">{delError}</p>}

        {remaining > 0 ? (
          <form action={action} encType="multipart/form-data" className="flex flex-col gap-3">
            <input type="hidden" name="productId" value={productId} />
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 hover:bg-slate-100">
              <ImagePlus className="text-slate-400" />
              <span className="font-medium">Add up to {remaining} more</span>
              <span className="text-xs text-slate-500">JPEG, PNG, or WEBP · max 5 MB each</span>
              <input
                type="file"
                name="images"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                required
              />
            </label>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            {state.ok && <p className="text-sm text-emerald-700">Images added.</p>}
            <div>
              <UploadBtn />
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-500">
            You&apos;ve reached the 8-image limit. Remove one to add another.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
