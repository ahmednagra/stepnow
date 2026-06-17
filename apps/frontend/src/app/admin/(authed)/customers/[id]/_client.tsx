// app/admin/(authed)/customers/[id]/_client.tsx
// Client island: fetches the customer + order history via React Query (browser bearer auth),
// renders the shared edit form and the order-history sub-list.

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty } from "@/components/admin";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { formatPriceEur } from "@/utils/decimal";
import { useCustomer, useCustomerOrders } from "@/hooks/queries/useCustomers";
import { CustomerForm } from "../_form";

export function CustomerEditClient({ id }: { id: string }) {
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { data: orders = [] } = useCustomerOrders(id);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (isError || !customer) notFound();

  const totalBilled = orders.reduce((sum, o) => sum + Number(o.gross_amount || 0), 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Customers"
        title={customer.company_name}
        description={customer.contact_person ?? "B2B customer"}
        actions={
          <Link href="/admin/customers" className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> All customers
          </Link>
        }
      />
      <div className="space-y-4 p-6">
        <CustomerForm mode="edit" initial={customer} />

        <AdminCard flush title={`${orders.length} order${orders.length === 1 ? "" : "s"} · ${formatPriceEur(String(totalBilled))} billed`}>
          <AdminTable columns={["Order-No.", "Route", "Delivery", "Gross"]}>
            {orders.length > 0 ? orders.map((o) => (
              <AdminTableRow key={o.id}>
                <AdminTableCell><Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">{o.order_number}</Link></AdminTableCell>
                <AdminTableCell>{o.pickup_address} → {o.destination_address}</AdminTableCell>
                <AdminTableCell><DeliveryStatusBadge status={o.delivery_status} /></AdminTableCell>
                <AdminTableCell>{formatPriceEur(o.gross_amount)}</AdminTableCell>
              </AdminTableRow>
            )) : <AdminTableEmpty message="No orders yet." />}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
