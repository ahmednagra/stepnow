// apps/frontend/src/app/admin/(authed)/settings/_form.tsx
// Site settings: identity, address, contact, legal credentials, opening hours,
// social links, SEO defaults. PATCHes /admin/settings on save.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import type { SettingsAdmin } from "@/types";
import { type SettingsUpdate } from "@/services/settings";
import { useUpdateSettings } from "@/hooks/mutations/useSettingsMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  adminSettingsSchema,
  type AdminSettingsInput,
} from "@/schemas/admin-settings.schema";
import {
  AdminCard,
  AdminFormField,
  ImageUploadField,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin";
import { uploadAdminFile } from "@/services/uploads/uploads.admin.client";

interface SettingsFormProps {
  initial: SettingsAdmin;
}

function defaultValues(s: SettingsAdmin): AdminSettingsInput {
  return {
    business_name: s.business_name ?? "",
    owner_name: s.owner_name ?? "",
    legal_form: s.legal_form ?? "",
    address_street: s.address_street ?? "",
    address_postcode: s.address_postcode ?? "",
    address_city: s.address_city ?? "",
    address_country: s.address_country ?? "",
    phone: s.phone ?? "",
    phone_mobile: s.phone_mobile ?? "",
    email: s.email ?? "",
    whatsapp_url: s.whatsapp_url ?? "",
    tax_number: s.tax_number ?? "",
    vat_id: s.vat_id ?? "",
    concession_number: s.concession_number ?? "",
    concession_authority: s.concession_authority ?? "",
    concession_date: s.concession_date ?? "",
    opening_hours_de: s.opening_hours_de ?? "",
    opening_hours_en: s.opening_hours_en ?? "",
    social_facebook: s.social_facebook ?? "",
    social_instagram: s.social_instagram ?? "",
    social_youtube: s.social_youtube ?? "",
    social_tiktok: s.social_tiktok ?? "",
    default_meta_title_de: s.default_meta_title_de ?? "",
    default_meta_title_en: s.default_meta_title_en ?? "",
    default_og_image_url: s.default_og_image_url ?? "",
  };
}

function toPatchPayload(values: AdminSettingsInput): SettingsUpdate {
  return {
    business_name: values.business_name,
    owner_name: values.owner_name,
    legal_form: values.legal_form?.trim() || null,
    address_street: values.address_street,
    address_postcode: values.address_postcode,
    address_city: values.address_city,
    address_country: values.address_country,
    phone: values.phone,
    phone_mobile: values.phone_mobile?.trim() || null,
    email: values.email,
    whatsapp_url: values.whatsapp_url?.trim() || null,
    tax_number: values.tax_number?.trim() || null,
    vat_id: values.vat_id?.trim() || null,
    concession_number: values.concession_number?.trim() || null,
    concession_authority: values.concession_authority?.trim() || null,
    concession_date: values.concession_date?.trim() || null,
    opening_hours_de: values.opening_hours_de ?? "",
    opening_hours_en: values.opening_hours_en ?? "",
    social_facebook: values.social_facebook?.trim() || null,
    social_instagram: values.social_instagram?.trim() || null,
    social_youtube: values.social_youtube?.trim() || null,
    social_tiktok: values.social_tiktok?.trim() || null,
    default_meta_title_de: values.default_meta_title_de,
    default_meta_title_en: values.default_meta_title_en,
    default_og_image_url: values.default_og_image_url?.trim() || null,
  };
}

async function uploadHandler(file: File): Promise<string> {
  const res = await uploadAdminFile(file);
  return res.url;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const updateSettings = useUpdateSettings();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminSettingsInput>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: defaultValues(initial),
  });

  async function onSubmit(values: AdminSettingsInput) {
    setServerError(null);
    try {
      const updated = await updateSettings.mutateAsync(toPatchPayload(values));
      reset(defaultValues(updated));
      pushToast("success", "Settings saved", "Public site updated.");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message || "Could not save changes.");
        pushToast("error", "Save failed", err.message);
      } else {
        setServerError("Something went wrong. Please try again.");
        pushToast("error", "Save failed", "Network or server error.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
        <p className="text-[12px] text-slate-500">
          {isDirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex h-9 items-center gap-2 bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>

      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {serverError}
        </div>
      )}

      {/* Identity */}
      <AdminCard title="Identity" description="Legal name shown on invoices and footer.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminFormField id="business_name" label="Business name" required error={errors.business_name?.message}>
            <input id="business_name" className={adminInputClass} {...register("business_name")} />
          </AdminFormField>
          <AdminFormField id="owner_name" label="Owner name" required error={errors.owner_name?.message}>
            <input id="owner_name" className={adminInputClass} {...register("owner_name")} />
          </AdminFormField>
          <AdminFormField
            id="legal_form"
            label="Legal form"
            hint="optional · e.g. Einzelunternehmer, GmbH"
            error={errors.legal_form?.message}
          >
            <input id="legal_form" className={adminInputClass} {...register("legal_form")} />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* Address */}
      <AdminCard title="Address">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-3">
            <AdminFormField id="address_street" label="Street" required error={errors.address_street?.message}>
              <input id="address_street" className={adminInputClass} {...register("address_street")} />
            </AdminFormField>
          </div>
          <div className="md:col-span-1">
            <AdminFormField id="address_postcode" label="Postcode" required error={errors.address_postcode?.message}>
              <input id="address_postcode" className={adminInputClass} {...register("address_postcode")} />
            </AdminFormField>
          </div>
          <div className="md:col-span-1">
            <AdminFormField id="address_city" label="City" required error={errors.address_city?.message}>
              <input id="address_city" className={adminInputClass} {...register("address_city")} />
            </AdminFormField>
          </div>
          <div className="md:col-span-1">
            <AdminFormField id="address_country" label="Country" required error={errors.address_country?.message}>
              <input id="address_country" className={adminInputClass} {...register("address_country")} />
            </AdminFormField>
          </div>
        </div>
      </AdminCard>

      {/* Contact */}
      <AdminCard title="Contact">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminFormField id="phone" label="Phone (landline)" required error={errors.phone?.message}>
            <input id="phone" type="tel" className={adminInputClass} {...register("phone")} />
          </AdminFormField>
          <AdminFormField id="phone_mobile" label="Phone (mobile)" hint="optional" error={errors.phone_mobile?.message}>
            <input id="phone_mobile" type="tel" className={adminInputClass} {...register("phone_mobile")} />
          </AdminFormField>
          <AdminFormField id="email" label="Email" required error={errors.email?.message}>
            <input id="email" type="email" className={adminInputClass} {...register("email")} />
          </AdminFormField>
          <AdminFormField id="whatsapp_url" label="WhatsApp URL" hint="optional" error={errors.whatsapp_url?.message}>
            <input
              id="whatsapp_url"
              type="url"
              placeholder="https://wa.me/..."
              className={adminInputClass}
              {...register("whatsapp_url")}
            />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* Legal & credentials */}
      <AdminCard title="Legal & credentials" description="Tax registrations and the § 49 PBefG concession.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminFormField id="tax_number" label="Tax number" hint="optional" error={errors.tax_number?.message}>
            <input id="tax_number" className={adminInputClass} {...register("tax_number")} />
          </AdminFormField>
          <AdminFormField id="vat_id" label="VAT ID" hint="optional" error={errors.vat_id?.message}>
            <input id="vat_id" className={adminInputClass} {...register("vat_id")} />
          </AdminFormField>
          <AdminFormField id="concession_number" label="Concession number" hint="optional" error={errors.concession_number?.message}>
            <input id="concession_number" className={adminInputClass} {...register("concession_number")} />
          </AdminFormField>
          <AdminFormField id="concession_authority" label="Concession authority" hint="optional" error={errors.concession_authority?.message}>
            <input id="concession_authority" className={adminInputClass} {...register("concession_authority")} />
          </AdminFormField>
          <AdminFormField
            id="concession_date"
            label="Concession date"
            hint="optional · YYYY-MM-DD"
            error={errors.concession_date?.message}
          >
            <input id="concession_date" type="date" className={adminInputClass} {...register("concession_date")} />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* Opening hours */}
      <AdminCard title="Opening hours" description="Free-form text shown in the footer and on the contact page.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminFormField id="opening_hours_de" label="German (DE)" error={errors.opening_hours_de?.message}>
            <textarea id="opening_hours_de" rows={4} className={adminTextareaClass} {...register("opening_hours_de")} />
          </AdminFormField>
          <AdminFormField id="opening_hours_en" label="English (EN)" error={errors.opening_hours_en?.message}>
            <textarea id="opening_hours_en" rows={4} className={adminTextareaClass} {...register("opening_hours_en")} />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* Social */}
      <AdminCard title="Social links" description="All optional. Leave blank to hide.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminFormField id="social_facebook" label="Facebook" error={errors.social_facebook?.message}>
            <input id="social_facebook" type="url" className={adminInputClass} {...register("social_facebook")} />
          </AdminFormField>
          <AdminFormField id="social_instagram" label="Instagram" error={errors.social_instagram?.message}>
            <input id="social_instagram" type="url" className={adminInputClass} {...register("social_instagram")} />
          </AdminFormField>
          <AdminFormField id="social_youtube" label="YouTube" error={errors.social_youtube?.message}>
            <input id="social_youtube" type="url" className={adminInputClass} {...register("social_youtube")} />
          </AdminFormField>
          <AdminFormField id="social_tiktok" label="TikTok" error={errors.social_tiktok?.message}>
            <input id="social_tiktok" type="url" className={adminInputClass} {...register("social_tiktok")} />
          </AdminFormField>
        </div>
      </AdminCard>

      {/* SEO */}
      <AdminCard title="SEO defaults" description="Used when a page doesn't supply its own meta title or OG image.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminFormField
            id="default_meta_title_de"
            label="Default meta title (DE)"
            required
            error={errors.default_meta_title_de?.message}
          >
            <input id="default_meta_title_de" className={adminInputClass} {...register("default_meta_title_de")} />
          </AdminFormField>
          <AdminFormField
            id="default_meta_title_en"
            label="Default meta title (EN)"
            required
            error={errors.default_meta_title_en?.message}
          >
            <input id="default_meta_title_en" className={adminInputClass} {...register("default_meta_title_en")} />
          </AdminFormField>
          <div className="md:col-span-2">
            <AdminFormField
              label="Default OG image"
              hint="Used for link previews on social media when a service has no specific OG image."
              error={errors.default_og_image_url?.message}
            >
              <Controller
                name="default_og_image_url"
                control={control}
                render={({ field }) => (
                  <ImageUploadField
                    label=""
                    value={field.value ? field.value : null}
                    onChange={(next) => field.onChange(next ?? "")}
                    onUpload={uploadHandler}
                  />
                )}
              />
            </AdminFormField>
          </div>
        </div>
      </AdminCard>
    </form>
  );
}
