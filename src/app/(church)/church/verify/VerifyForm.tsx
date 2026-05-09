"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { churchVerifyPickupAction } from "@/app/actions/orders";

export function VerifyForm() {
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr(null);
          setOk(null);
          const r = await churchVerifyPickupAction(code);
          if ("error" in r && r.error) setErr(r.error);
          else if ("ok" in r && r.ok) {
            setOk("Pickup verified · order marked picked up");
            setCode("");
            router.refresh();
          }
        });
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <Label htmlFor="code">Pickup code</Label>
        <Input
          id="code"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          inputMode="numeric"
          required
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && (
        <p className="inline-flex items-center gap-1 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> {ok}
        </p>
      )}
      <Button type="submit" disabled={pending || code.length < 4}>
        {pending ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
