// app/admin/(authed)/drivers/[id]/page.tsx
// Driver detail: editable record + job history. Client island (reads id via useParams).

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty } from "@/components/admin";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { formatPriceEur } from "@/utils/decimal";
import { useDriver } from "@/hooks/queries";
import { useDriverOrders } from "@/hooks/queries/useDrivers";
import { DriverForm } from "../_form";

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: driver, isLoading } = useDriver(id);
  const { data: jobs = [] } = useDriverOrders(id);

  if (isLoading || !driver) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <>
      <AdminPageHeader eyebrow="Drivers" title={driver.full_name} description="Driver record and job history." />
      <div className="space-y-4 p-6">
        <DriverForm mode="edit" initial={driver} />

        <AdminCard flush title={`${jobs.length} job${jobs.length === 1 ? "" : "s"}`}>
          <AdminTable columns={["Order-No.", "Route", "Delivery", "Gross"]}>
            {jobs.length > 0 ? jobs.map((o) => (
              <AdminTableRow key={o.id}>
                <AdminTableCell><Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">{o.order_number}</Link></AdminTableCell>
                <AdminTableCell>{o.pickup_address} → {o.destination_address}</AdminTableCell>
                <AdminTableCell><DeliveryStatusBadge status={o.delivery_status} /></AdminTableCell>
                <AdminTableCell>{formatPriceEur(o.gross_amount)}</AdminTableCell>
              </AdminTableRow>
            )) : <AdminTableEmpty message="No jobs assigned yet." />}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
