"use client";

import { useState } from "react";
import { ChurchIcon, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChurchPicker } from "./ChurchPicker";

type Branch = {
  id: string;
  churchName: string;
  denomination: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
};

export function DeliveryChoice({
  branches,
  denominations,
  states,
}: {
  branches: Branch[];
  denominations: string[];
  states: string[];
}) {
  const [type, setType] = useState<"HOME_DELIVERY" | "CHURCH_PICKUP">("CHURCH_PICKUP");

  return (
    <div className="flex flex-col gap-6">
      <input type="hidden" name="deliveryType" value={type} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Option
          checked={type === "CHURCH_PICKUP"}
          onClick={() => setType("CHURCH_PICKUP")}
          icon={<ChurchIcon />}
          title="Church pickup"
          subtitle="Pickup at your local church branch · ₦800"
        />
        <Option
          checked={type === "HOME_DELIVERY"}
          onClick={() => setType("HOME_DELIVERY")}
          icon={<Truck />}
          title="Home delivery"
          subtitle="Doorstep delivery · ₦1,500"
        />
      </div>

      {type === "CHURCH_PICKUP" ? (
        <ChurchPicker branches={branches} denominations={denominations} states={states} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="deliveryAddress" label="Street address" required wide />
          <Field name="deliveryCity" label="City" required />
          <Field name="deliveryState" label="State" required />
        </div>
      )}
    </div>
  );
}

function Option({
  checked,
  onClick,
  icon,
  title,
  subtitle,
}: {
  checked: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        checked ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className={cn("text-brand-700", checked && "text-brand-800")}>{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </button>
  );
}

function Field({
  name,
  label,
  required,
  wide,
}: {
  name: string;
  label: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
      />
    </div>
  );
}
