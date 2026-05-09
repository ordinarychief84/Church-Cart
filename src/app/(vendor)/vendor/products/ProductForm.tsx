"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Product, ProductCategory, ProductImage } from "@prisma/client";
import { createProductAction, updateProductAction } from "@/app/actions/vendor";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initial = {} as { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

function SubmitBtn({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
    </Button>
  );
}

type Props = {
  categories: ProductCategory[];
  mode: "create" | "edit";
  product?: Product & { images: ProductImage[] };
};

export function ProductForm({ categories, mode, product }: Props) {
  const action =
    mode === "create"
      ? createProductAction
      : updateProductAction.bind(null, product!.id);
  const [state, formAction] = useFormState(action as never, initial);

  return (
    <Card>
      <CardBody>
        <form action={formAction} encType="multipart/form-data" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={product?.title ?? ""} required />
            {state.fieldErrors?.title && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.title[0]}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={5} defaultValue={product?.description ?? ""} required />
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId} required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="priceNaira">Price (₦)</Label>
            <Input
              id="priceNaira"
              name="priceNaira"
              type="number"
              min={0.01}
              step={0.01}
              inputMode="decimal"
              defaultValue={product ? (product.priceKobo / 100).toFixed(2) : ""}
              required
            />
            <p className="mt-1 text-xs text-slate-500">e.g. 2500.00 for ₦2,500</p>
          </div>
          <div>
            <Label htmlFor="inventoryQty">Inventory quantity</Label>
            <Input
              id="inventoryQty"
              name="inventoryQty"
              type="number"
              min={0}
              defaultValue={product?.inventoryQty ?? 0}
              required
            />
          </div>
          <div>
            <Label htmlFor="weightGrams">Weight (g, optional)</Label>
            <Input
              id="weightGrams"
              name="weightGrams"
              type="number"
              min={0}
              defaultValue={product?.weightGrams ?? ""}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="available"
              type="checkbox"
              name="available"
              defaultChecked={product?.available ?? true}
              className="h-4 w-4"
            />
            <label htmlFor="available" className="text-sm">
              Available for purchase
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isDigital"
              type="checkbox"
              name="isDigital"
              defaultChecked={product?.isDigital ?? false}
              className="h-4 w-4"
            />
            <label htmlFor="isDigital" className="text-sm">
              Digital product (no shipping)
            </label>
          </div>

          {mode === "create" && (
            <div className="sm:col-span-2">
              <Label htmlFor="images">Images (up to 8, max 5 MB each)</Label>
              <input
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm"
              />
            </div>
          )}

          {state.error && <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>}
          <div className="sm:col-span-2">
            <SubmitBtn mode={mode} />
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
