// apps/frontend/src/app/admin/(authed)/orders/[id]/page.tsx
// Order detail. Server fetch → OrderDetailIsland client component.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import type { OrderDetail } from "@/services/orders";
import { AdminPageHeader } from "@/components/admin";
import { OrderDetailIsland } from "./_detail";

export const dynamic = "force-dynamic";

async function loadOrder(id: string): Promise<OrderDetail | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<OrderDetail>(`/admin/orders/${id}`, undefined, token);
  return res.data ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const o = await loadOrder(params.id);
  return { title: o ? `${o.order_number} · Orders · StepNow Admin` : "Order · StepNow Admin" };
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await loadOrder(params.id);
  if (!order) notFound();
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
