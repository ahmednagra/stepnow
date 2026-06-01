// app/admin/(authed)/drivers/[id]/page.tsx
// Driver detail: editable contact + job history. Client island (reads id via useParams).

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty } from "@/components/admin";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatPriceEur } from "@/utils/decimal";
import { getAdminDriver, updateAdminDriver, listDriverOrders, type DriverAdmin } from "@/services/drivers";
import type { CourierOrder } from "@/services/courier";

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const pushToast = useAdminToast((s) => s.push);
  const [driver, setDriver] = useState<DriverAdmin | null>(null);
  const [jobs, setJobs] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, j] = await Promise.all([getAdminDriver(id), listDriverOrders(id)]);
      setDriver(d); setJobs(j);
    } catch (err) {
      pushToast("error", "Could not load driver", err instanceof ApiError ? err.message : "Network error");
    } finally { setLoading(false); }
  }, [id, pushToast]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!driver) return;
    setBusy(true);
    try {
      const updated = await updateAdminDriver(driver.id, {
        full_name: driver.full_name, phone: driver.phone, email: driver.email,
        vehicle_label: driver.vehicle_label, active: driver.active, internal_notes: driver.internal_notes,
      });
      setDriver(updated); pushToast("success", "Saved");
    } catch (err) {
      pushToast("error", "Save failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  if (loading || !driver) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <>
      <AdminPageHeader eyebrow="Drivers" title={driver.full_name} description="Driver record and job history." />
      <div className="space-y-4 p-6">
        <AdminCard title="Contact">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label="Full name"><input className={adminInputClass} value={driver.full_name} onChange={(e) => setDriver({ ...driver, full_name: e.target.value })} /></AdminFormField>
            <AdminFormField label="Vehicle"><input className={adminInputClass} value={driver.vehicle_label ?? ""} onChange={(e) => setDriver({ ...driver, vehicle_label: e.target.value })} /></AdminFormField>
            <AdminFormField label="Phone"><input className={adminInputClass} value={driver.phone ?? ""} onChange={(e) => setDriver({ ...driver, phone: e.target.value })} /></AdminFormField>
            <AdminFormField label="Email"><input className={adminInputClass} value={driver.email ?? ""} onChange={(e) => setDriver({ ...driver, email: e.target.value })} /></AdminFormField>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={driver.active} onChange={(e) => setDriver({ ...driver, active: e.target.checked })} /> Active
          </label>
          <button onClick={save} disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
          </button>
        </AdminCard>

        <AdminCard flush title={`${jobs.length} job${jobs.length === 1 ? "" : "s"}`}>
          <AdminTable columns={["Order-No.", "Route", "Delivery", "Gross"]}>
            {jobs.length > 0 ? jobs.map((o) => (
              <AdminTableRow key={o.id}>
                <AdminTableCell><Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">{o.order_number}</Link></AdminTableCell>
                <AdminTableCell>{o.pickup_address} → {o.destination_address}</AdminTableCell>
                <AdminTableCell><DeliveryStatusBadge status={o.delivery_status} /></AdminTableCell>
                <AdminTableCell>{formatPriceEur(o.gross_amount)}</AdminTableCell>
              </AdminTableRow>
            )) : <AdminTableEmpty colSpan={4} message="No jobs assigned yet." />}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
