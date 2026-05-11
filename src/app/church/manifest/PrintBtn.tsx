"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintBtn() {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => window.print()}
      leadingIcon={<Printer size={12} />}
    >
      Print
    </Button>
  );
}
