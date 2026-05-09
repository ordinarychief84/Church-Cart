"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createCategoryAction, toggleCategoryAction } from "@/app/actions/admin";

type Cat = { id: string; name: string; slug: string; active: boolean; productCount: number };

export function CategoryAdminPanel({ categories }: { categories: Cat[] }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="grid gap-4">
      <Card>
        <CardBody className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
          />
          <Button
            disabled={pending || !name}
            onClick={() =>
              start(async () => {
                await createCategoryAction(name);
                setName("");
                router.refresh();
              })
            }
          >
            Add
          </Button>
        </CardBody>
      </Card>
      <ul className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between border-b border-slate-200 p-3 last:border-0">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-slate-500">
                {c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "Active" : "Hidden"}</Badge>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => start(async () => { await toggleCategoryAction(c.id); router.refresh(); })}
              >
                {c.active ? "Hide" : "Show"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
