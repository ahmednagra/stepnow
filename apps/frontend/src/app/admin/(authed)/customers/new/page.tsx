// app/admin/(authed)/customers/new/page.tsx
// New customer — full-page create form mirroring the New-order builder's conventions
// (AdminPageHeader + stacked AdminCard sections + sticky action bar). Built on the admin
// design system; wired to createAdminCustomer. Single column — a customer record has no
// document to preview, unlike an order.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, User, Building2, Mail, MapPin, FileText } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass, adminTextareaClass } from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { createAdminCustomer, type CustomerInput } from "@/services/customers";
import { cn } from "@/utils/cn";

type FieldErrors = Partial<Record<"first_name" | "last_name" | "email", string>>;

const emailOk = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

export default function NewCustomerPage() {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);

  const [isBusiness, setIsBusiness] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", company_name: "", company_vatid: "",
    email: "", phone: "", street: "", plz: "", ort: "", internal_notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!form.first_name.trim()) next.first_name = "First name is required.";
    if (!form.last_name.trim()) next.last_name = "Last name is required.";
    if (form.email.trim() && !emailOk(form.email.trim())) next.email = "Enter a valid email.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) { pushToast("error", "Please fix the highlighted fields"); return; }
    setBusy(true);
    const orNull = (v: string) => (v.trim() ? v.trim() : null);
    const payload: CustomerInput = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      is_business: isBusiness,
      company_name: isBusiness ? orNull(form.company_name) : null,
      company_vatid: isBusiness ? orNull(form.company_vatid) : null,
      street: orNull(form.street),
      plz: orNull(form.plz),
      ort: orNull(form.ort),
      email: orNull(form.email),
      phone: orNull(form.phone),
      internal_notes: orNull(form.internal_notes),
    };
    try {
      const created = await createAdminCustomer(payload);
      pushToast("success", "Customer created", `${created.first_name} ${created.last_name}`);
      router.push(`/admin/customers/${created.id}`);
      router.refresh();
    } catch (err) {
      pushToast("error", "Create failed", err instanceof ApiError ? err.message : "Network error");
      setBusy(false);
    }
  }

  const typeChip = (active: boolean) =>
    cn("flex flex-1 items-center justify-center gap-2 border px-3 py-2 text-[12px] font-semibold transition-colors",
      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400");

  return (
    <>
      <AdminPageHeader
        eyebrow="Customers"
        title="New customer"
        description="Add a sender / biller for repeat courier jobs. Saved customers appear in the order builder's search."
        actions={
          <Link href="/admin/customers" className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> All customers
          </Link>
        }
      />

      <div className="max-w-[820px] space-y-4 p-6">
        {/* Type */}
        <AdminCard
          title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Customer type</span>}
          description="Business customers show company name & VAT-ID for invoicing."
        >
          <div className="flex gap-2">
            <button type="button" className={typeChip(!isBusiness)} onClick={() => setIsBusiness(false)}>
              <User className="h-3.5 w-3.5" strokeWidth={1.6} /> Private
            </button>
            <button type="button" className={typeChip(isBusiness)} onClick={() => setIsBusiness(true)}>
              <Building2 className="h-3.5 w-3.5" strokeWidth={1.6} /> Business
            </button>
          </div>
        </AdminCard>

        {/* Identity */}
        <AdminCard title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Identity</span>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label="First name" required error={errors.first_name}>
              <input className={adminInputClass} value={form.first_name} onChange={set("first_name")} placeholder="Jonas" />
            </AdminFormField>
            <AdminFormField label="Last name" required error={errors.last_name}>
              <input className={adminInputClass} value={form.last_name} onChange={set("last_name")} placeholder="Wagner" />
            </AdminFormField>
            {isBusiness && (
              <>
                <AdminFormField label="Company name" className="sm:col-span-2">
                  <input className={adminInputClass} value={form.company_name} onChange={set("company_name")} placeholder="Wagner Logistik & Spedition" />
                </AdminFormField>
                <AdminFormField label="VAT-ID" hint="USt-IdNr. — printed on B2B invoices.">
                  <input className={adminInputClass} value={form.company_vatid} onChange={set("company_vatid")} placeholder="DE123456789" />
                </AdminFormField>
              </>
            )}
          </div>
        </AdminCard>

        {/* Contact */}
        <AdminCard title={<span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Contact</span>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFormField label="Email" error={errors.email}>
              <input className={adminInputClass} type="email" value={form.email} onChange={set("email")} placeholder="name@example.de" />
            </AdminFormField>
            <AdminFormField label="Phone">
              <input className={adminInputClass} value={form.phone} onChange={set("phone")} placeholder="+49 711 1234567" />
            </AdminFormField>
          </div>
        </AdminCard>

        {/* Address */}
        <AdminCard title={<span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Address</span>}>
          <div className="grid gap-3 sm:grid-cols-4">
            <AdminFormField label="Street" className="sm:col-span-4">
              <input className={adminInputClass} value={form.street} onChange={set("street")} placeholder="Bahnhofstraße 28" />
            </AdminFormField>
            <AdminFormField label="Postcode (PLZ)">
              <input className={adminInputClass} value={form.plz} onChange={set("plz")} placeholder="73730" />
            </AdminFormField>
            <AdminFormField label="City" className="sm:col-span-3">
              <input className={adminInputClass} value={form.ort} onChange={set("ort")} placeholder="Esslingen" />
            </AdminFormField>
          </div>
        </AdminCard>

        {/* Internal */}
        <AdminCard
          title={<span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Internal notes</span>}
          description="Only visible to admins."
        >
          <textarea className={adminTextareaClass} rows={2} value={form.internal_notes} onChange={set("internal_notes")}
            placeholder="e.g. preferred pickup window, billing quirks, account contact…" />
        </AdminCard>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_18px_rgba(15,23,42,0.05)]">
          <span className="text-[11.5px] text-slate-400">Not saved yet — customer is created on save.</span>
          <div className="ml-auto flex gap-2">
            <Link href="/admin/customers" className="flex h-9 items-center border border-slate-300 bg-white px-4 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">Cancel</Link>
            <button type="button" onClick={save} disabled={busy}
              className="flex h-9 items-center gap-1.5 bg-slate-900 px-4 text-[12.5px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {busy ? "Creating…" : "Create customer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
