"use client";

import { useMemo, useState } from "react";
import { ChurchIcon, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Branch = {
  id: string;
  churchName: string;
  denomination: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
};

export function ChurchPicker({
  branches,
  denominations,
  states,
}: {
  branches: Branch[];
  denominations: string[];
  states: string[];
}) {
  const [denom, setDenom] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [chosen, setChosen] = useState<string>("");

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      if (denom && b.churchName !== denom && b.denomination !== denom) return false;
      if (state && b.state !== state) return false;
      if (city && !b.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !b.branchName.toLowerCase().includes(needle) &&
          !b.churchName.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
  }, [branches, denom, state, city, q]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <input type="hidden" name="churchBranchId" value={chosen} />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Choose a pickup branch</p>
        {!chosen && (
          <p className="text-xs text-amber-700">Pick a branch below before you continue</p>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <select
          value={denom}
          onChange={(e) => setDenom(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
        >
          <option value="">All churches</option>
          {denominations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Branch name"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <ul className="mt-4 grid max-h-72 gap-2 overflow-y-auto">
        {filtered.length === 0 && <li className="text-sm text-slate-500">No matching branches.</li>}
        {filtered.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => setChosen(b.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded border p-3 text-left",
                chosen === b.id ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:bg-slate-50"
              )}
            >
              <ChurchIcon className="mt-0.5 text-brand-700" size={18} />
              <div>
                <p className="font-medium">
                  {b.churchName} — {b.branchName}
                </p>
                <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={12} /> {b.address}, {b.city}, {b.state}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
