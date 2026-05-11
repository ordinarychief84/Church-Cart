"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ChurchIcon, ShoppingBag, Store } from "lucide-react";
import {
  completeOnboardingAction,
  type CompleteOnboardingState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui";

const initial: CompleteOnboardingState = {};

const OPTIONS = [
  {
    value: "BUYER",
    label: "I want to buy",
    sub: "Shop and pick up at your church",
    icon: ShoppingBag,
  },
  {
    value: "SELLER",
    label: "I want to sell",
    sub: "List digital or physical products",
    icon: Store,
  },
  {
    value: "CHURCH_ADMIN",
    label: "I lead a church branch",
    sub: "Host pickups for members",
    icon: ChurchIcon,
  },
] as const;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Setting up your account…" : "Continue"}
    </Button>
  );
}

export function OnboardingForm({ next }: { next?: string }) {
  const [state, action] = useFormState(completeOnboardingAction, initial);
  const [role, setRole] = useState<(typeof OPTIONS)[number]["value"]>("BUYER");

  return (
    <form action={action} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="role" value={role} />

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Choose a role</legend>
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = role === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? "border-[color:var(--cp-gold)] bg-[color:var(--cp-sand)]/30 ring-1 ring-[color:var(--cp-gold)]"
                  : "border-[color:var(--cp-rule)] bg-white hover:border-[color:var(--cp-gold)]/50"
              }`}
              aria-pressed={selected}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[color:var(--cp-sand)] text-[color:var(--cp-cocoa-deep)]">
                <Icon size={18} />
              </span>
              <span className="flex-1">
                <span className="block font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
                  {opt.label}
                </span>
                <span className="block text-body-sm text-[color:var(--cp-cocoa-mid)]">
                  {opt.sub}
                </span>
              </span>
              <span
                className={`h-4 w-4 rounded-full border ${
                  selected
                    ? "border-[color:var(--cp-gold)] bg-[color:var(--cp-gold)]"
                    : "border-[color:var(--cp-rule)]"
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </fieldset>

      {state.error && (
        <p className="text-body-sm text-[color:var(--cp-error)]">{state.error}</p>
      )}
      <SubmitBtn />
    </form>
  );
}
