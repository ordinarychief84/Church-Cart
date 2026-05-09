"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeliveryChoice } from "@/components/checkout/DeliveryChoice";
import { createCheckoutAction } from "@/app/actions/checkout";

const initial = {} as { error?: string; fieldErrors?: Record<string, string[]> };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Placing order…" : "Continue to payment"}
    </Button>
  );
}

type Branch = {
  id: string;
  churchName: string;
  denomination: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
};

export function CheckoutForm({
  branches,
  denominations,
  states,
}: {
  branches: Branch[];
  denominations: string[];
  states: string[];
}) {
  const [state, action] = useFormState(createCheckoutAction, initial);
  return (
    <Card>
      <CardBody>
        <form action={action} className="flex flex-col gap-6">
          <DeliveryChoice branches={branches} denominations={denominations} states={states} />
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.fieldErrors && (
            <ul className="text-sm text-red-600">
              {Object.entries(state.fieldErrors).map(([k, v]) => (
                <li key={k}>{v[0]}</li>
              ))}
            </ul>
          )}
          <SubmitBtn />
        </form>
      </CardBody>
    </Card>
  );
}
