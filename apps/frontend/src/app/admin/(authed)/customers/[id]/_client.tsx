// app/admin/(authed)/customers/[id]/_client.tsx
// Client island: fetches the customer + one page of order history via React Query (browser bearer
// auth), renders the shared edit form and the paginated order-history sub-list. The card's lifetime
// totals come from the customer record's SQL rollups, never from summing the loaded page.

"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { useDefaultCurrency } from "@/hooks/queries";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty, Pagination } from "@/components/admin";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { formatMoney } from "@/utils/decimal";
import { useCustomer, useCustomerOrders } from "@/hooks/queries/useCustomers";
import { CustomerForm } from "../_form";

const PAGE_SIZE = 20;

export function CustomerEditClient({ id }: { id: string }) {
  const cur = useDefaultCurrency();
  const [page, setPage] = useState(1);
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { data: ordersPage } = useCustomerOrders(id, { page, size: PAGE_SIZE });
  const orders = ordersPage?.items ?? [];
  const pagination = ordersPage?.pagination;

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (isError || !customer) notFound();

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

        <AdminCard flush title={`${customer.orders_count} order${customer.orders_count === 1 ? "" : "s"} · ${formatMoney(customer.total_billed, cur)} billed`}>
          <AdminTable columns={["Order-No.", "Route", "Delivery", "Gross"]}>
            {orders.length > 0 ? orders.map((o) => (
              <AdminTableRow key={o.id}>
                <AdminTableCell><Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">{o.order_number}</Link></AdminTableCell>
                <AdminTableCell>{o.pickup_address} → {o.destination_address}</AdminTableCell>
                <AdminTableCell><DeliveryStatusBadge status={o.delivery_status} /></AdminTableCell>
                <AdminTableCell>{formatMoney(o.gross_amount, cur)}</AdminTableCell>
              </AdminTableRow>
            )) : <AdminTableEmpty message="No orders yet." />}
          </AdminTable>
          {pagination && pagination.pages > 1 && (
            <Pagination page={pagination.page} totalPages={pagination.pages} totalItems={pagination.total} onPageChange={setPage} />
          )}
        </AdminCard>
      </div>
    </>
  );
}
