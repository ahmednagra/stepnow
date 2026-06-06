// app/admin/(authed)/drivers/page.tsx
// Drivers list + quick-create. Mirrors the orders list (FilterToolbar + AdminTable + Pagination).

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  FilterToolbar, Pagination, AdminFormField, adminInputClass,
} from "@/components/admin";
import { Badge } from "@/components/ui/Badge";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { listAdminDrivers, createAdminDriver, type DriverAdmin, type DriverInput } from "@/services/drivers";

const PAGE_SIZE = 20;

export default function DriversPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [rows, setRows] = useState<DriverAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [draft, setDraft] = useState<DriverInput>({ full_name: "", phone: "", email: "", vehicle_label: "", active: true });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminDrivers({ page, size: PAGE_SIZE, q: q || undefined });
      setRows(res.items); setPages(res.pagination.pages); setTotal(res.pagination.total);
    } catch (err) {
      pushToast("error", "Could not load drivers", err instanceof ApiError ? err.message : "Network error");
    } finally { setLoading(false); }
  }, [page, q, pushToast]);

  useEffect(() => { void reload(); }, [reload]);

  async function create() {
    if (!draft.full_name.trim()) { pushToast("error", "Driver name is required"); return; }
    setSaving(true);
    try {
      await createAdminDriver(draft);
      setDraft({ full_name: "", phone: "", email: "", vehicle_label: "", active: true });
      pushToast("success", "Driver added");
      void reload();
    } catch (err) {
      pushToast("error", "Could not add driver", err instanceof ApiError ? err.message : "Network error");
    } finally { setSaving(false); }
  }

  return (
    <>
      <AdminPageHeader eyebrow="Operations" title="Drivers" description="Couriers the Fahrauftrag is dispatched to." />
      <div className="space-y-4 p-6">
        <AdminCard title="Add driver">
          <div className="grid gap-3 sm:grid-cols-4">
            <AdminFormField label="Full name *"><input className={adminInputClass} value={draft.full_name} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} /></AdminFormField>
            <AdminFormField label="Phone"><input className={adminInputClass} value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></AdminFormField>
            <AdminFormField label="Email"><input className={adminInputClass} value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></AdminFormField>
            <AdminFormField label="Vehicle"><input className={adminInputClass} value={draft.vehicle_label ?? ""} onChange={(e) => setDraft({ ...draft, vehicle_label: e.target.value })} placeholder="B-Klasse · SN 1122" /></AdminFormField>
          </div>
          <button onClick={create} disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add driver
          </button>
        </AdminCard>

        <FilterToolbar searchValue={q} onSearchChange={(v: string) => { setPage(1); setQ(v); }} searchPlaceholder="Search name, email, phone…" />

        <AdminCard flush title={`${total} ${total === 1 ? "driver" : "drivers"}`}>
          <AdminTable columns={["Name", "Phone", "Email", "Vehicle", "Status"]}>
            {loading ? (
              <AdminTableEmpty loading />
            ) : rows && rows.length > 0 ? (
              rows.map((d) => (
                <AdminTableRow key={d.id}>
                  <AdminTableCell><Link href={`/admin/drivers/${d.id}`} className="font-semibold text-slate-900 hover:underline">{d.full_name}</Link></AdminTableCell>
                  <AdminTableCell>{d.phone ?? "—"}</AdminTableCell>
                  <AdminTableCell>{d.email ?? "—"}</AdminTableCell>
                  <AdminTableCell>{d.vehicle_label ?? "—"}</AdminTableCell>
                  <AdminTableCell><Badge tone={d.active ? "success" : "neutral"}>{d.active ? "Active" : "Inactive"}</Badge></AdminTableCell>
                </AdminTableRow>
              ))
            ) : (
              <AdminTableEmpty message="No drivers yet." />
            )}
          </AdminTable>
        </AdminCard>
        <Pagination page={page} totalPages={pages} totalItems={total} onPageChange={setPage} />
      </div>
    </>
  );
}
