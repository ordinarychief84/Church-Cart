"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Subscribes to UPDATE events on this order and refreshes the server-rendered
 * page when status changes (seller marks shipped, church marks arrived, etc.).
 * Realtime is enabled on `justhazaar.orders` via the migration; the buyer's
 * RLS lets them see only their own rows, so the filter is enforced both
 * client-side (for efficiency) and on the server (for safety).
 */
export function OrderRealtime({ orderId }: { orderId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "justhazaar",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, router]);

  return null;
}
