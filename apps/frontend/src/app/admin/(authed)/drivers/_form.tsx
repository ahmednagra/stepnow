// app/admin/(authed)/drivers/_form.tsx
// Shared driver create/edit form — react-hook-form + zod. Captures the §21 StVG / §48 FeV
// compliance record. Wired to createAdminDriver / updateAdminDriver.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, User, Car, IdCard, FileText } from "lucide-react";
import { AdminCard, AdminFormField, adminInputClass, adminTextareaClass } from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { adminDriverSchema, type AdminDriverInput } from "@/schemas/admin-driver.schema";
import { type DriverAdmin, type DriverInput } from "@/services/drivers";
import { useCreateDriver, useUpdateDriver } from "@/hooks/mutations/useDriverMutations";
import { cn } from "@/utils/cn";

const LICENSE_CLASSES = ["B", "BE", "C1", "C1E", "C", "D1", "D"] as const;

type Mode = "create" | "edit";
interface DriverFormProps { mode: Mode; initial?: DriverAdmin; }

function emptyDefaults(): AdminDriverInput {
  return {
    full_name: "", phone: "", email: "", vehicle_label: "", active: true,
    license_number: "", license_classes: [], license_expiry: "", license_restrictions: "",
    has_pschein: false, pschein_number: "", pschein_expiry: "", internal_notes: "",
  };
}

function fromDriver(d: DriverAdmin): AdminDriverInput {
  return {
    full_name: d.full_name,
    phone: d.phone ?? "",
    email: d.email ?? "",
    vehicle_label: d.vehicle_label ?? "",
    active: d.active,
    license_number: d.license_number ?? "",
    license_classes: d.license_classes ?? [],
    license_expiry: d.license_expiry ?? "",
    license_restrictions: d.license_restrictions ?? "",
    has_pschein: Boolean(d.pschein_number || d.pschein_expiry),
    pschein_number: d.pschein_number ?? "",
    pschein_expiry: d.pschein_expiry ?? "",
    internal_notes: d.internal_notes ?? "",
  };
}

function toPayload(values: AdminDriverInput): DriverInput {
  const orNull = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  return {
    full_name: values.full_name.trim(),
    phone: orNull(values.phone),
    email: orNull(values.email),
    vehicle_label: orNull(values.vehicle_label),
    active: values.active,
    license_number: orNull(values.license_number),
    license_classes: values.license_classes.length ? values.license_classes : null,
    license_expiry: orNull(values.license_expiry),
    license_restrictions: orNull(values.license_restrictions),
    pschein_number: values.has_pschein ? orNull(values.pschein_number) : null,
    pschein_expiry: values.has_pschein ? orNull(values.pschein_expiry) : null,
    internal_notes: orNull(values.internal_notes),
  };
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" className="text-[11px] font-medium text-rose-700">{msg}</p>;
}

export function DriverForm({ mode, initial }: DriverFormProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);
  const create = useCreateDriver();
  const update = useUpdateDriver(initial?.id ?? "");

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminDriverInput>({
    resolver: zodResolver(adminDriverSchema),
    defaultValues: initial ? fromDriver(initial) : emptyDefaults(),
  });

  const classes = watch("license_classes");
  const hasPschein = watch("has_pschein");

  const toggleClass = (c: string) => {
    const next = classes.includes(c) ? classes.filter((x) => x !== c) : [...classes, c];
    setValue("license_classes", next, { shouldDirty: true });
  };

  async function onSubmit(values: AdminDriverInput) {
    setServerError(null);
    try {
      if (mode === "create") {
        const created = await create.mutateAsync(toPayload(values));
        pushToast("success", "Driver created", created.full_name);
        router.push(`/admin/drivers/${created.id}`);
        router.refresh();
      } else if (initial) {
        const updated = await update.mutateAsync(toPayload(values));
        reset(fromDriver(updated));
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-[860px] space-y-4">
      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{serverError}</div>
      )}

      {/* Driver & contact */}
      <AdminCard title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Driver &amp; contact</span>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Full name" required error={errors.full_name?.message}>
            <input className={adminInputClass} {...register("full_name")} placeholder="Stefan Wagner" />
          </AdminFormField>
          <AdminFormField label="Phone">
            <input className={adminInputClass} {...register("phone")} placeholder="+49 159 01225852" />
          </AdminFormField>
          <AdminFormField label="Email" error={errors.email?.message}>
            <input className={adminInputClass} type="email" {...register("email")} placeholder="name@step-now.de" />
          </AdminFormField>
          <AdminFormField label="Status">
            <select
              className={adminInputClass}
              value={watch("active") ? "true" : "false"}
              onChange={(e) => setValue("active", e.target.value === "true", { shouldDirty: true })}
            >
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
          <input className={adminInputClass} {...register("vehicle_label")} placeholder="B-Klasse · SN 1122" />
        </AdminFormField>
      </AdminCard>

      {/* Driving licence */}
      <AdminCard title={<span className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Driving licence (Führerschein)</span>}
        description="Recorded for §21 StVG owner-liability. Entering it logs today as the first check.">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Licence number">
            <input className={adminInputClass} {...register("license_number")} placeholder="B072RRE2I55" />
          </AdminFormField>
          <AdminFormField label="Licence expiry">
            <input className={adminInputClass} type="date" {...register("license_expiry")} />
          </AdminFormField>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-medium tracking-tight text-slate-700">Classes held</p>
          <div className="flex flex-wrap gap-2">
            {LICENSE_CLASSES.map((c) => (
              <button key={c} type="button" onClick={() => toggleClass(c)}
                className={cn("border px-3 py-1.5 font-mono text-[12px] font-bold",
                  classes.includes(c) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400")}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <AdminFormField label="Restrictions (§23(2) FeV)" hint="Legally required to record. Leave blank if none.">
            <input className={adminInputClass} {...register("license_restrictions")} placeholder="e.g. Automatik (code 78)" />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* P-Schein */}
      <AdminCard title={<span className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Passenger transport (P-Schein)</span>}
        description="Required for ride drivers (Fahrgastbeförderung). Not needed for courier-only.">
        <label className="flex items-center gap-2.5 border border-slate-200 bg-slate-50 px-3 py-2.5">
          <input type="checkbox" {...register("has_pschein")} className="h-4 w-4" />
          <span><span className="block text-[13px] font-semibold text-slate-700">Driver carries passengers (rides)</span>
          <span className="block text-[11px] text-slate-500">Enable to record the Fahrerlaubnis zur Fahrgastbeförderung.</span></span>
        </label>
        {hasPschein && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <AdminFormField label="P-Schein number">
              <input className={adminInputClass} {...register("pschein_number")} placeholder="P-2024-3391" />
            </AdminFormField>
            <AdminFormField label="P-Schein expiry" hint="Typically valid 5 years; renewed at the Fahrerlaubnisbehörde.">
              <input className={adminInputClass} type="date" {...register("pschein_expiry")} />
            </AdminFormField>
          </div>
        )}
      </AdminCard>

      {/* Internal */}
      <AdminCard title={<span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Internal notes</span>}
        description="Only visible to admins.">
        <textarea className={adminTextareaClass} rows={2} {...register("internal_notes")}
          placeholder="e.g. shift preference, languages, equipment…" />
        <FieldErr msg={errors.internal_notes?.message} />
      </AdminCard>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_18px_rgba(15,23,42,0.05)]">
        <span className="text-[11.5px] text-slate-400">
          {mode === "create" ? "Not saved yet — driver is created on save." : "Edit the driver record."}
        </span>
        <div className="ml-auto flex gap-2">
          <Link href="/admin/drivers" className="flex h-9 items-center border border-slate-300 bg-white px-4 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={isSubmitting}
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-4 text-[12.5px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {isSubmitting ? (mode === "create" ? "Creating…" : "Saving…") : mode === "create" ? "Create driver" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
