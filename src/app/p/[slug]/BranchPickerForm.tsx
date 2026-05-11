"use client";

import { useState } from "react";
import { ChurchIcon, MapPin } from "lucide-react";
import { useFormStatus } from "react-dom";
import { placeChurchPickupOrderAction } from "@/app/actions/buyer";
import { Button } from "@/components/ui";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type { Denomination } from "@/lib/supabase/types";

type PickerBranch = {
  id: string;
  denomination: Denomination;
  branch_name: string;
  city: string;
  state: string;
};

function PlaceOrderBtn() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      leadingIcon={<ChurchIcon size={16} />}
      className="w-full"
    >
      {pending ? "Placing order…" : "Place pickup order"}
    </Button>
  );
}

export function BranchPickerForm({
  productId,
  branches,
  defaultBranchId,
}: {
  productId: string;
  branches: PickerBranch[];
  defaultBranchId?: string | null;
}) {
  const [branchId, setBranchId] = useState<string>(
    defaultBranchId && branches.some((b) => b.id === defaultBranchId)
      ? defaultBranchId
      : branches[0]?.id ?? ""
  );

  return (
    <form action={placeChurchPickupOrderAction} className="flex flex-col gap-3">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="branch_id" value={branchId} />

      <fieldset>
        <legend className="input-label mb-2">Choose your pickup branch</legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {branches.map((b) => {
            const selected = b.id === branchId;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setBranchId(b.id)}
                  aria-pressed={selected}
                  className={`flex w-full flex-col items-start gap-1 rounded-lg border p-3 text-left text-body-sm transition-colors ${
                    selected
                      ? "border-[color:var(--cp-gold)] bg-[color:var(--cp-sand)]/30 ring-1 ring-[color:var(--cp-gold)]"
                      : "border-[color:var(--cp-rule)] bg-white hover:border-[color:var(--cp-gold)]/50"
                  }`}
                >
                  <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                    {DENOMINATION_LABELS[b.denomination]} — {b.branch_name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                    <MapPin size={11} /> {b.city}, {b.state}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <PlaceOrderBtn />
      <p className="text-caption text-[color:var(--cp-cocoa-mid)]">
        Your order will be reserved at the branch you pick. You'll pay on the next screen.
      </p>
    </form>
  );
}
