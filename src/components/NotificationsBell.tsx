"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { markAllNotificationsReadAction } from "@/app/actions/buyer";

type Notification = {
  id: string;
  type: string;
  order_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

const TYPE_HREF: Record<string, (orderId: string | null) => string> = {
  ORDER_PLACED: (id) => `/seller/orders/${id}`,
  PAYMENT_CONFIRMED: (id) => `/seller/orders/${id}`,
  ORDER_PROCESSING: (id) => `/buyer/orders/${id}`,
  ORDER_SHIPPED: (id) => `/buyer/orders/${id}`,
  ORDER_ARRIVED_AT_CHURCH: (id) => `/buyer/orders/${id}`,
  ORDER_READY_FOR_PICKUP: (id) => `/buyer/orders/${id}`,
  ORDER_PICKED_UP: (id) => `/buyer/orders/${id}`,
  ORDER_CANCELLED: (id) => `/buyer/orders/${id}`,
};

export function NotificationsBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read_at).length;

  // Initial fetch + realtime subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, order_id, title, body, read_at, created_at")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (!cancelled && data) setItems(data as Notification[]);
    }
    load();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "justhazaar",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev].slice(0, 15));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "justhazaar",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n))
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Click-outside to close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs">
            <p className="font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-brand-700 hover:underline"
              >
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-500">No notifications yet</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => {
                const href = TYPE_HREF[n.type]?.(n.order_id) ?? "#";
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block px-3 py-2 text-sm hover:bg-slate-50 ${
                        n.read_at ? "" : "bg-brand-50/40"
                      }`}
                    >
                      <p className="font-medium text-slate-900">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
