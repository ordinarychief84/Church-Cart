"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createProductAction, updateProductAction, type Result } from "@/app/actions/seller";
import { PRODUCT_TYPES } from "@/lib/validation";
import {
  DIGITAL_PRODUCT_TYPE_LABEL,
  type ChurchBranch,
  type Product,
  type ProductCategory,
} from "@/lib/supabase/types";
import { BranchMultiSelect } from "@/components/seller/BranchMultiSelect";
import { Button } from "@/components/ui";

const initial: Result = {};

function SubmitBtn({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : mode === "create" ? "List product" : "Save changes"}
    </Button>
  );
}

type FormAction = (prev: Result, formData: FormData) => Promise<Result>;

type BranchPick = Pick<ChurchBranch, "id" | "denomination" | "branch_name" | "city" | "state">;

export function ProductForm({
  categories,
  branches,
  initialPickupBranchIds,
  mode,
  product,
}: {
  categories: ProductCategory[];
  branches: BranchPick[];
  initialPickupBranchIds: string[];
  mode: "create" | "edit";
  product?: Product;
}) {
  const action: FormAction =
    mode === "create" ? createProductAction : updateProductAction.bind(null, product!.id);
  const [state, formAction] = useFormState(action, initial);

  const [isDigital, setIsDigital] = useState<boolean>(product ? product.is_digital : false);

  return (
    <form action={formAction} className="card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Fulfilment */}
        <fieldset className="sm:col-span-2">
          <legend className="input-label mb-2">Fulfilment</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <FulfilmentChoice
              checked={!isDigital}
              onSelect={() => setIsDigital(false)}
              title="Physical product"
              body="Stock, weight, and pickup at a church branch"
            />
            <FulfilmentChoice
              checked={isDigital}
              onSelect={() => setIsDigital(true)}
              title="Digital product"
              body="Course / ebook / template — buyer pays via your Paystack link"
            />
          </div>
          <input type="hidden" name="is_digital" value={isDigital ? "on" : "off"} />
        </fieldset>

        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <input
            id="title"
            name="title"
            className="input"
            defaultValue={product?.title ?? ""}
            placeholder={
              isDigital
                ? "e.g. 30-day Christian Discipleship Course"
                : "e.g. Hand-bound Leather Prayer Journal"
            }
            required
          />
          <FieldError errors={state.fieldErrors?.title} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product?.description ?? ""}
            placeholder="What does the buyer get? Length, format, who it's for…"
            required
            className="input"
          />
          <FieldError errors={state.fieldErrors?.description} />
        </div>

        <div>
          <Label htmlFor="product_type">Type</Label>
          <select
            id="product_type"
            name="product_type"
            className="input"
            defaultValue={product?.product_type ?? (isDigital ? "COURSE" : "OTHER")}
            required
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {DIGITAL_PRODUCT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            className="input"
            defaultValue={product?.category_id ?? ""}
            required
          >
            <option value="">— select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.category_id} />
        </div>

        <div>
          <Label htmlFor="price_naira">Price (₦)</Label>
          <input
            id="price_naira"
            name="price_naira"
            type="number"
            step={0.01}
            min={0.01}
            inputMode="decimal"
            defaultValue={product ? (product.price_kobo / 100).toFixed(2) : ""}
            required
            placeholder="2500.00"
            className="input"
          />
          <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
            e.g. 2500.00 for ₦2,500
          </p>
          <FieldError errors={state.fieldErrors?.price_naira} />
        </div>

        <div>
          <Label htmlFor="cover_image_url">Cover image URL (optional)</Label>
          <input
            id="cover_image_url"
            name="cover_image_url"
            defaultValue={product?.cover_image_url ?? ""}
            placeholder="https://…"
            className="input"
          />
          <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
            Direct link to a square JPG / PNG / WEBP.
          </p>
          <FieldError errors={state.fieldErrors?.cover_image_url} />
        </div>

        {!isDigital && (
          <>
            <div>
              <Label htmlFor="inventory_qty">Stock on hand</Label>
              <input
                id="inventory_qty"
                name="inventory_qty"
                type="number"
                min={0}
                defaultValue={product?.inventory_qty ?? 0}
                required
                className="input"
              />
              <FieldError errors={state.fieldErrors?.inventory_qty} />
            </div>
            <div>
              <Label htmlFor="weight_grams">Weight (grams, optional)</Label>
              <input
                id="weight_grams"
                name="weight_grams"
                type="number"
                min={0}
                defaultValue={product?.weight_grams ?? ""}
                placeholder="e.g. 380"
                className="input"
              />
              <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                Helps churches plan storage. Leave blank if unknown.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Pickup at church branches</Label>
              <BranchMultiSelect branches={branches} initialSelected={initialPickupBranchIds} />
              <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                Pick every branch where members can collect this item. Only approved branches show
                here.
              </p>
              <FieldError errors={state.fieldErrors?.pickup_branch_ids} />
            </div>
          </>
        )}

        {isDigital && (
          <div className="sm:col-span-2">
            <Label htmlFor="paystack_payment_url">
              Paystack payment link{" "}
              <span className="text-[color:var(--cp-mid)]">(members click this to pay)</span>
            </Label>
            <input
              id="paystack_payment_url"
              name="paystack_payment_url"
              defaultValue={product?.paystack_payment_url ?? ""}
              placeholder="https://paystack.com/pay/your-product"
              className="input"
            />
            <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
              Create a payment page in your Paystack dashboard and paste the URL here. Looks like{" "}
              <span className="font-mono">https://paystack.com/pay/…</span> or{" "}
              <span className="font-mono">https://paystack.shop/…</span>.
            </p>
            <FieldError errors={state.fieldErrors?.paystack_payment_url} />
          </div>
        )}

        <label className="sm:col-span-2 flex items-center gap-2 text-body-sm text-[color:var(--cp-cocoa-deep)]">
          <input
            type="checkbox"
            name="available"
            defaultChecked={product?.available ?? true}
            className="h-4 w-4 rounded border-[color:var(--cp-rule)] accent-[color:var(--cp-gold)]"
          />
          Live on my store (uncheck to save as draft)
        </label>
      </div>

      {state.error && (
        <p className="mt-4 text-body-sm text-[color:var(--cp-error)]">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-4 text-body-sm text-[color:var(--cp-success)]">Saved.</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <SubmitBtn mode={mode} />
        {mode === "edit" && product && (
          <a
            href={`/p/${product.slug}`}
            target="_blank"
            className="text-body-sm font-medium text-[color:var(--cp-gold)] hover:underline"
          >
            View public page →
          </a>
        )}
      </div>
    </form>
  );
}

function FulfilmentChoice({
  checked,
  onSelect,
  title,
  body,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        checked
          ? "border-[color:var(--cp-gold)] bg-[color:var(--cp-sand)]/30 ring-1 ring-[color:var(--cp-gold)]"
          : "border-[color:var(--cp-rule)] bg-white hover:border-[color:var(--cp-gold)]/50"
      }`}
    >
      <span
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
          checked
            ? "border-[color:var(--cp-gold)] bg-[color:var(--cp-gold)]"
            : "border-[color:var(--cp-rule)] bg-white"
        }`}
      >
        {checked && <span className="block h-1.5 w-1.5 rounded-full bg-[color:var(--cp-cocoa-deep)]" />}
      </span>
      <span>
        <span className="block font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
          {title}
        </span>
        <span className="block text-tag text-[color:var(--cp-cocoa-mid)]">{body}</span>
      </span>
    </button>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="input-label">
      {children}
    </label>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="input-error">{errors[0]}</p>;
}
