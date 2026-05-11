"use client";

import { useMemo, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { DENOMINATION_LABELS } from "@/lib/validation";
import type { ChurchBranch } from "@/lib/supabase/types";

type Branch = Pick<
  ChurchBranch,
  "id" | "denomination" | "branch_name" | "city" | "state"
>;

export function BranchMultiSelect({
  branches,
  initialSelected,
  disabled,
}: {
  branches: Branch[];
  initialSelected: string[];
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return branches;
    const needle = q.toLowerCase();
    return branches.filter(
      (b) =>
        b.branch_name.toLowerCase().includes(needle) ||
        b.city.toLowerCase().includes(needle) ||
        b.state.toLowerCase().includes(needle) ||
        DENOMINATION_LABELS[b.denomination].toLowerCase().includes(needle)
    );
  }, [branches, q]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--cp-rule)] bg-white",
        disabled && "opacity-50"
      )}
    >
      <input
        type="hidden"
        name="pickup_branch_ids"
        value={Array.from(selected).join(",")}
      />
      <div className="border-b border-[color:var(--cp-rule)] p-2">
        <input
          type="text"
          placeholder="Search branches…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={disabled}
          className="input"
          style={{ padding: "8px 12px" }}
        />
        <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
          {selected.size} branch{selected.size === 1 ? "" : "es"} selected
        </p>
      </div>
      <ul className="max-h-72 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-body-sm text-[color:var(--cp-cocoa-mid)]">
            No matching branches.
          </li>
        ) : (
          filtered.map((b) => {
            const isOn = selected.has(b.id);
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => toggle(b.id)}
                  disabled={disabled}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2 text-left text-body-sm transition-colors hover:bg-[color:var(--cp-cream)]",
                    isOn && "bg-[color:var(--cp-sand)]/30"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border",
                      isOn
                        ? "border-[color:var(--cp-gold)] bg-[color:var(--cp-gold)] text-[color:var(--cp-cocoa-deep)]"
                        : "border-[color:var(--cp-rule)] bg-white"
                    )}
                  >
                    {isOn && <Check size={12} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                      {DENOMINATION_LABELS[b.denomination]} — {b.branch_name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                      <MapPin size={10} /> {b.city}, {b.state}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
