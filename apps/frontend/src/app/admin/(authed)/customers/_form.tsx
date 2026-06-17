// app/admin/(authed)/customers/_form.tsx
// Shared customer create/edit form. react-hook-form + zod, mirroring the vehicles _form.tsx
// three-mapper shape (emptyDefaults / fromCustomer / toPayload). Used by customers/new and
// customers/[id] (edit). Single column — a customer record has no document to preview.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, User, Building2, Mail, MapPin, FileText } from "lucide-react";
import { adminCustomerSchema, type AdminCustomerInput } from "@/schemas/admin-customer.schema";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { AdminCard, AdminFormField, adminInputClass, adminTextareaClass } from "@/components/admin";
import { type CustomerAdmin, type CustomerInput } from "@/services/customers";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/mutations/useCustomerMutations";
import { cn } from "@/utils/cn";

type Mode = "create" | "edit";
interface CustomerFormProps { mode: Mode; initial?: CustomerAdmin; }

function emptyDefaults(): AdminCustomerInput {
  return {
    first_name: "", last_name: "", is_business: false,
    company_name: "", company_vatid: "",
    email: "", phone: "", street: "", plz: "", ort: "", internal_notes: "",
  };
}

function fromCustomer(c: CustomerAdmin): AdminCustomerInput {
  return {
    first_name: c.first_name, last_name: c.last_name, is_business: c.is_business,
    company_name: c.company_name ?? "", company_vatid: c.company_vatid ?? "",
    email: c.email ?? "", phone: c.phone ?? "",
    street: c.street ?? "", plz: c.plz ?? "", ort: c.ort ?? "",
    internal_notes: c.internal_notes ?? "",
  };
}

function toPayload(values: AdminCustomerInput): CustomerInput {
  const orNull = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    is_business: values.is_business,
    company_name: values.is_business ? orNull(values.company_name) : null,
    company_vatid: values.is_business ? orNull(values.company_vatid) : null,
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
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminCustomerInput>({
    resolver: zodResolver(adminCustomerSchema),
    defaultValues: initial ? fromCustomer(initial) : emptyDefaults(),
  });

  const isBusiness = watch("is_business");

  async function onSubmit(values: AdminCustomerInput) {
    setServerError(null);
    try {
      if (mode === "create") {
        const created = await create.mutateAsync(toPayload(values));
        pushToast("success", "Customer created", `${created.first_name} ${created.last_name}`);
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

  const typeChip = (active: boolean) =>
    cn("flex flex-1 items-center justify-center gap-2 border px-3 py-2 text-[12px] font-semibold transition-colors",
      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-[820px] space-y-4">
      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{serverError}</div>
      )}

      {/* Type */}
      <AdminCard
        title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Customer type</span>}
        description="Business customers show company name & VAT-ID for invoicing."
      >
        <div className="flex gap-2">
          <button type="button" className={typeChip(!isBusiness)} onClick={() => setValue("is_business", false, { shouldDirty: true })}>
            <User className="h-3.5 w-3.5" strokeWidth={1.6} /> Private
          </button>
          <button type="button" className={typeChip(isBusiness)} onClick={() => setValue("is_business", true, { shouldDirty: true })}>
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.6} /> Business
          </button>
        </div>
      </AdminCard>

      {/* Identity */}
      <AdminCard title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Identity</span>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="First name" required error={errors.first_name?.message}>
            <input className={adminInputClass} {...register("first_name")} placeholder="Jonas" />
          </AdminFormField>
          <AdminFormField label="Last name" required error={errors.last_name?.message}>
            <input className={adminInputClass} {...register("last_name")} placeholder="Wagner" />
          </AdminFormField>
          {isBusiness && (
            <>
              <AdminFormField label="Company name" className="sm:col-span-2" error={errors.company_name?.message}>
                <input className={adminInputClass} {...register("company_name")} placeholder="Wagner Logistik & Spedition" />
              </AdminFormField>
              <AdminFormField label="VAT-ID" hint="USt-IdNr. — printed on B2B invoices." error={errors.company_vatid?.message}>
                <input className={adminInputClass} {...register("company_vatid")} placeholder="DE123456789" />
              </AdminFormField>
            </>
          )}
        </div>
      </AdminCard>

      {/* Contact */}
      <AdminCard title={<span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Contact</span>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Email" error={errors.email?.message}>
            <input className={adminInputClass} type="email" {...register("email")} placeholder="name@example.de" />
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
