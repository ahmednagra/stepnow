// app/admin/(authed)/customers/_form.tsx
// Shared customer create/edit form. react-hook-form + zod. Company-first (B2B): the customer
// is a company (company_name) with an optional contact person (Ansprechpartner). Used by
// customers/new and customers/[id] (edit). Single column — no document to preview.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Building2, Mail, MapPin, FileText } from "lucide-react";
import { adminCustomerSchema, type AdminCustomerInput } from "@/schemas/admin-customer.schema";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { AdminCard, AdminFormField, adminInputClass, adminTextareaClass } from "@/components/admin";
import { type CustomerAdmin, type CustomerInput } from "@/services/customers";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/mutations/useCustomerMutations";

type Mode = "create" | "edit";
interface CustomerFormProps { mode: Mode; initial?: CustomerAdmin; }

function emptyDefaults(): AdminCustomerInput {
  return {
    company_name: "", contact_person: "", is_business: true,
    company_vatid: "", tax_number: "",
    email: "", phone: "", street: "", plz: "", ort: "", internal_notes: "",
  };
}

function fromCustomer(c: CustomerAdmin): AdminCustomerInput {
  return {
    company_name: c.company_name, contact_person: c.contact_person ?? "", is_business: c.is_business,
    company_vatid: c.company_vatid ?? "", tax_number: c.tax_number ?? "",
    email: c.email ?? "", phone: c.phone ?? "",
    street: c.street ?? "", plz: c.plz ?? "", ort: c.ort ?? "",
    internal_notes: c.internal_notes ?? "",
  };
}

function toPayload(values: AdminCustomerInput): CustomerInput {
  const orNull = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  return {
    company_name: values.company_name.trim(),
    contact_person: orNull(values.contact_person),
    is_business: true,
    company_vatid: orNull(values.company_vatid),
    tax_number: orNull(values.tax_number),
    street: orNull(values.street),
    plz: orNull(values.plz),
    ort: orNull(values.ort),
    email: orNull(values.email),
    phone: orNull(values.phone),
    internal_notes: orNull(values.internal_notes),
  };
}

export function CustomerForm({ mode, initial }: CustomerFormProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);
  const create = useCreateCustomer();
  const update = useUpdateCustomer(initial?.id ?? "");

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminCustomerInput>({
    resolver: zodResolver(adminCustomerSchema),
    defaultValues: initial ? fromCustomer(initial) : emptyDefaults(),
  });

  async function onSubmit(values: AdminCustomerInput) {
    setServerError(null);
    try {
      if (mode === "create") {
        const created = await create.mutateAsync(toPayload(values));
        pushToast("success", "Customer created", created.company_name);
        router.push(`/admin/customers/${created.id}`);
        router.refresh();
      } else if (initial) {
        const updated = await update.mutateAsync(toPayload(values));
        reset(fromCustomer(updated));
        pushToast("success", "Saved");
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", mode === "create" ? "Create failed" : "Save failed", msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-[820px] space-y-4">
      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{serverError}</div>
      )}

      {/* Company */}
      <AdminCard
        title={<span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Company</span>}
        description="B2B customer — orders are placed between companies. Add an optional contact person."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Company name" required className="sm:col-span-2" error={errors.company_name?.message}>
            <input className={adminInputClass} {...register("company_name")} placeholder="Wagner Logistik & Spedition GmbH" />
          </AdminFormField>
          <AdminFormField label="Contact person" hint="Ansprechpartner — optional." error={errors.contact_person?.message}>
            <input className={adminInputClass} {...register("contact_person")} placeholder="Jonas Wagner" />
          </AdminFormField>
          <AdminFormField label="VAT-ID" hint="USt-IdNr. — printed on B2B invoices." error={errors.company_vatid?.message}>
            <input className={adminInputClass} {...register("company_vatid")} placeholder="DE123456789" />
          </AdminFormField>
          <AdminFormField label="Tax number" hint="Steuernummer — optional." error={errors.tax_number?.message}>
            <input className={adminInputClass} {...register("tax_number")} placeholder="59500/72609" />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* Contact */}
      <AdminCard title={<span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Contact</span>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Email" error={errors.email?.message}>
            <input className={adminInputClass} type="email" {...register("email")} placeholder="dispatch@example.de" />
          </AdminFormField>
          <AdminFormField label="Phone" error={errors.phone?.message}>
            <input className={adminInputClass} {...register("phone")} placeholder="+49 711 1234567" />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* Address */}
      <AdminCard title={<span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Address</span>}>
        <div className="grid gap-3 sm:grid-cols-4">
          <AdminFormField label="Street" className="sm:col-span-4" error={errors.street?.message}>
            <input className={adminInputClass} {...register("street")} placeholder="Bahnhofstraße 28" />
          </AdminFormField>
          <AdminFormField label="Postcode (PLZ)" error={errors.plz?.message}>
            <input className={adminInputClass} {...register("plz")} placeholder="73730" />
          </AdminFormField>
          <AdminFormField label="City" className="sm:col-span-3" error={errors.ort?.message}>
            <input className={adminInputClass} {...register("ort")} placeholder="Esslingen" />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* Internal */}
      <AdminCard
        title={<span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Internal notes</span>}
        description="Only visible to admins."
      >
        <textarea className={adminTextareaClass} rows={2} {...register("internal_notes")}
          placeholder="e.g. preferred pickup window, billing quirks, account contact…" />
      </AdminCard>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_18px_rgba(15,23,42,0.05)]">
        <span className="text-[11.5px] text-slate-400">
          {mode === "create" ? "Not saved yet — customer is created on save." : "Changes are saved to the customer record."}
        </span>
        <div className="ml-auto flex gap-2">
          <Link href="/admin/customers" className="flex h-9 items-center border border-slate-300 bg-white px-4 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={isSubmitting}
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-4 text-[12.5px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {isSubmitting ? (mode === "create" ? "Creating…" : "Saving…") : mode === "create" ? "Create customer" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
