// app/admin/(authed)/drivers/new/page.tsx
// New driver — full-page create form mirroring the New-order builder (AdminPageHeader +
// stacked AdminCard sections + sticky action bar). Captures the §21 StVG / §48 FeV compliance
// record. Wired to createAdminDriver; if licence data is entered, the backend logs today as
// the first check and sets the next-due date.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, User, Car, IdCard, FileText } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass, adminTextareaClass } from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { createAdminDriver, type DriverInput } from "@/services/drivers";
import { cn } from "@/utils/cn";

const LICENSE_CLASSES = ["B", "BE", "C1", "C1E", "C", "D1", "D"] as const;
const emailOk = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

type FieldErrors = Partial<Record<"full_name" | "email", string>>;

export default function NewDriverPage() {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", vehicle_label: "", active: true,
    license_number: "", license_expiry: "", license_restrictions: "",
    pschein_number: "", pschein_expiry: "", internal_notes: "",
  });
  const [classes, setClasses] = useState<Set<string>>(new Set());
  const [hasPschein, setHasPschein] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleClass = (c: string) =>
    setClasses((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c); else n.add(c);
      return n;
    });

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!form.full_name.trim()) next.full_name = "Full name is required.";
    if (form.email.trim() && !emailOk(form.email.trim())) next.email = "Enter a valid email.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) { pushToast("error", "Please fix the highlighted fields"); return; }
    setBusy(true);
    const orNull = (v: string) => (v.trim() ? v.trim() : null);
    const payload: DriverInput = {
      full_name: form.full_name.trim(),
      phone: orNull(form.phone),
      email: orNull(form.email),
      vehicle_label: orNull(form.vehicle_label),
      active: form.active,
      license_number: orNull(form.license_number),
      license_classes: classes.size ? [...classes] : null,
      license_expiry: orNull(form.license_expiry),
      license_restrictions: orNull(form.license_restrictions),
      pschein_number: hasPschein ? orNull(form.pschein_number) : null,
      pschein_expiry: hasPschein ? orNull(form.pschein_expiry) : null,
      internal_notes: orNull(form.internal_notes),
    };
    try {
      const created = await createAdminDriver(payload);
      pushToast("success", "Driver created", created.full_name);
      router.push(`/admin/drivers/${created.id}`);
      router.refresh();
    } catch (err) {
      pushToast("error", "Create failed", err instanceof ApiError ? err.message : "Network error");
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="New driver"
        description="Add a courier / ride driver. Licence & P-Schein details enable §21 StVG dispatch-compliance tracking."
        actions={
          <Link href="/admin/drivers" className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> All drivers
          </Link>
        }
      />

      <div className="max-w-[860px] space-y-4 p-6">
        {/* Driver & contact */}
        <AdminCard title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Driver &amp; contact</span>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label="Full name" required error={errors.full_name}>
              <input className={adminInputClass} value={form.full_name} onChange={set("full_name")} placeholder="Stefan Wagner" />
            </AdminFormField>
            <AdminFormField label="Phone">
              <input className={adminInputClass} value={form.phone} onChange={set("phone")} placeholder="+49 159 01225852" />
            </AdminFormField>
            <AdminFormField label="Email" error={errors.email}>
              <input className={adminInputClass} type="email" value={form.email} onChange={set("email")} placeholder="name@step-now.de" />
            </AdminFormField>
            <AdminFormField label="Status">
              <select className={adminInputClass} value={form.active ? "true" : "false"} onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "true" }))}>
                <option value="true">Active — dispatchable</option>
                <option value="false">Inactive</option>
              </select>
            </AdminFormField>
          </div>
        </AdminCard>

        {/* Vehicle */}
        <AdminCard title={<span className="flex items-center gap-2"><Car className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Vehicle</span>}
          description="Free-text label shown on the Fahrauftrag.">
          <AdminFormField label="Vehicle label">
            <input className={adminInputClass} value={form.vehicle_label} onChange={set("vehicle_label")} placeholder="B-Klasse · SN 1122" />
          </AdminFormField>
        </AdminCard>

        {/* Driving licence */}
        <AdminCard title={<span className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Driving licence (Führerschein)</span>}
          description="Recorded for §21 StVG owner-liability. Entering it logs today as the first check.">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label="Licence number">
              <input className={adminInputClass} value={form.license_number} onChange={set("license_number")} placeholder="B072RRE2I55" />
            </AdminFormField>
            <AdminFormField label="Licence expiry">
              <input className={adminInputClass} type="date" value={form.license_expiry} onChange={set("license_expiry")} />
            </AdminFormField>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[12px] font-medium tracking-tight text-slate-700">Classes held</p>
            <div className="flex flex-wrap gap-2">
              {LICENSE_CLASSES.map((c) => (
                <button key={c} type="button" onClick={() => toggleClass(c)}
                  className={cn("border px-3 py-1.5 font-mono text-[12px] font-bold",
                    classes.has(c) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400")}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <AdminFormField label="Restrictions (§23(2) FeV)" hint="Legally required to record. Leave blank if none.">
              <input className={adminInputClass} value={form.license_restrictions} onChange={set("license_restrictions")} placeholder="e.g. Automatik (code 78)" />
            </AdminFormField>
          </div>
        </AdminCard>

        {/* P-Schein */}
        <AdminCard title={<span className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Passenger transport (P-Schein)</span>}
          description="Required for ride drivers (Fahrgastbeförderung). Not needed for courier-only.">
          <label className="flex items-center gap-2.5 border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input type="checkbox" checked={hasPschein} onChange={(e) => setHasPschein(e.target.checked)} className="h-4 w-4" />
            <span><span className="block text-[13px] font-semibold text-slate-700">Driver carries passengers (rides)</span>
            <span className="block text-[11px] text-slate-500">Enable to record the Fahrerlaubnis zur Fahrgastbeförderung.</span></span>
          </label>
          {hasPschein && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <AdminFormField label="P-Schein number">
                <input className={adminInputClass} value={form.pschein_number} onChange={set("pschein_number")} placeholder="P-2024-3391" />
              </AdminFormField>
              <AdminFormField label="P-Schein expiry" hint="Typically valid 5 years; renewed at the Fahrerlaubnisbehörde.">
                <input className={adminInputClass} type="date" value={form.pschein_expiry} onChange={set("pschein_expiry")} />
              </AdminFormField>
            </div>
          )}
        </AdminCard>

        {/* Internal */}
        <AdminCard title={<span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Internal notes</span>}
          description="Only visible to admins.">
          <textarea className={adminTextareaClass} rows={2} value={form.internal_notes} onChange={set("internal_notes")}
            placeholder="e.g. shift preference, languages, equipment…" />
        </AdminCard>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_18px_rgba(15,23,42,0.05)]">
          <span className="text-[11.5px] text-slate-400">Not saved yet — driver is created on save.</span>
          <div className="ml-auto flex gap-2">
            <Link href="/admin/drivers" className="flex h-9 items-center border border-slate-300 bg-white px-4 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">Cancel</Link>
            <button type="button" onClick={save} disabled={busy}
              className="flex h-9 items-center gap-1.5 bg-slate-900 px-4 text-[12.5px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {busy ? "Creating…" : "Create driver"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
