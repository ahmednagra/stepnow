// apps/frontend/src/app/admin/(authed)/orders/[id]/_client.tsx
// Client island: fetches the order via React Query (browser bearer auth).

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { OrderDetailIsland } from "./_detail";
import { useOrder } from "@/hooks/queries";

export function OrderDetailClient({ id }: { id: string }) {
  const { data: order, isLoading, isError } = useOrder(id);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !order) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow={`Order · ${order.order_number}`}
        title={order.customer_name}
        description={order.customer_email}
        actions={
          <Link
            href="/admin/orders"
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            All orders
          </Link>
        }
      />
      <div className="p-6"><OrderDetailIsland initial={order} /></div>
    </>
  );
}
