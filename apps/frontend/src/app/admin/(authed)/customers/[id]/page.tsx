// app/admin/(authed)/customers/[id]/page.tsx
// Customer detail: editable record + order history with total billed (gross).

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty } from "@/components/admin";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatPriceEur } from "@/utils/decimal";
import { getAdminCustomer, updateAdminCustomer, listCustomerOrders, type CustomerAdmin } from "@/services/customers";
import type { CourierOrder } from "@/services/courier";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const pushToast = useAdminToast((s) => s.push);
  const [customer, setCustomer] = useState<CustomerAdmin | null>(null);
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, o] = await Promise.all([getAdminCustomer(id), listCustomerOrders(id)]);
      setCustomer(c); setOrders(o);
    } catch (err) {
      pushToast("error", "Could not load customer", err instanceof ApiError ? err.message : "Network error");
    } finally { setLoading(false); }
  }, [id, pushToast]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!customer) return;
    setBusy(true);
    try {
      const updated = await updateAdminCustomer(customer.id, {
        first_name: customer.first_name, last_name: customer.last_name, is_business: customer.is_business,
        company_name: customer.company_name, company_vatid: customer.company_vatid,
        street: customer.street, plz: customer.plz, ort: customer.ort,
        email: customer.email, phone: customer.phone, internal_notes: customer.internal_notes,
      });
      setCustomer(updated); pushToast("success", "Saved");
    } catch (err) {
      pushToast("error", "Save failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  if (loading || !customer) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  const totalBilled = orders.reduce((sum, o) => sum + Number(o.gross_amount || 0), 0);

  return (
    <>
      <AdminPageHeader eyebrow="Customers" title={`${customer.first_name} ${customer.last_name}`} description={customer.company_name ?? "Private customer"} />
      <div className="space-y-4 p-6">
        <AdminCard title="Record">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label="First name"><input className={adminInputClass} value={customer.first_name} onChange={(e) => setCustomer({ ...customer, first_name: e.target.value })} /></AdminFormField>
            <AdminFormField label="Last name"><input className={adminInputClass} value={customer.last_name} onChange={(e) => setCustomer({ ...customer, last_name: e.target.value })} /></AdminFormField>
            <AdminFormField label="Company"><input className={adminInputClass} value={customer.company_name ?? ""} onChange={(e) => setCustomer({ ...customer, company_name: e.target.value })} /></AdminFormField>
            <AdminFormField label="VAT ID"><input className={adminInputClass} value={customer.company_vatid ?? ""} onChange={(e) => setCustomer({ ...customer, company_vatid: e.target.value })} /></AdminFormField>
            <AdminFormField label="Street"><input className={adminInputClass} value={customer.street ?? ""} onChange={(e) => setCustomer({ ...customer, street: e.target.value })} /></AdminFormField>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="Postcode"><input className={adminInputClass} value={customer.plz ?? ""} onChange={(e) => setCustomer({ ...customer, plz: e.target.value })} /></AdminFormField>
              <AdminFormField label="City"><input className={adminInputClass} value={customer.ort ?? ""} onChange={(e) => setCustomer({ ...customer, ort: e.target.value })} /></AdminFormField>
            </div>
            <AdminFormField label="Email"><input className={adminInputClass} value={customer.email ?? ""} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></AdminFormField>
            <AdminFormField label="Phone"><input className={adminInputClass} value={customer.phone ?? ""} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></AdminFormField>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={customer.is_business} onChange={(e) => setCustomer({ ...customer, is_business: e.target.checked })} /> Business customer
          </label>
          <button onClick={save} disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
          </button>
        </AdminCard>

        <AdminCard flush title={`${orders.length} order${orders.length === 1 ? "" : "s"} · ${formatPriceEur(String(totalBilled))} billed`}>
          <AdminTable columns={["Order-No.", "Route", "Delivery", "Gross"]}>
            {orders.length > 0 ? orders.map((o) => (
              <AdminTableRow key={o.id}>
                <AdminTableCell><Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">{o.order_number}</Link></AdminTableCell>
                <AdminTableCell>{o.pickup_address} → {o.destination_address}</AdminTableCell>
                <AdminTableCell><DeliveryStatusBadge status={o.delivery_status} /></AdminTableCell>
                <AdminTableCell>{formatPriceEur(o.gross_amount)}</AdminTableCell>
              </AdminTableRow>
            )) : <AdminTableEmpty colSpan={4} message="No orders yet." />}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
