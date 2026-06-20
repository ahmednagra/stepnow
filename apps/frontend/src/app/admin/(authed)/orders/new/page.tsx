// app/admin/(authed)/orders/new/page.tsx
// New transport-order console, modelled on the local StepNow_Buchhaltung tool. An order is
// anchored to a VEHICLE first (the primary identifier) and a free-text driver second. Two-pane
// builder (Order · Customer · Route · Pricing · Logbook · Payment) with a live driver-slip /
// invoice preview and a sticky action bar. The admin chrome is English; the document preview
// stays German because it mirrors the real German PDFs rendered server-side. Built entirely on
// the admin design system (AdminPageHeader / AdminCard / AdminFormField + Tailwind tokens).
//
// Form state is react-hook-form + zod (admin-order.schema.ts) — the three mappers
// (emptyDefaults / toPayload) keep the form shape separate from the API payload. The five
// action-bar actions (save / pdf / whatsapp / email-driver / email-invoice) all run through
// handleSubmit so zod validation gates every persist, then share ensureSaved().

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User, Mail, Phone, MapPin, ArrowRight, ArrowLeft, Truck, Route as RouteIcon, Gauge,
  CalendarDays, CalendarClock, Hash, Receipt, Check, X, Eye, EyeOff, Save, FileDown,
  Loader2, AlertCircle, Tag, ClipboardList, ChevronDown, MessageCircle, FileText,
} from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass } from "@/components/admin";
import { DatePicker } from "@/components/ui";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { cn } from "@/utils/cn";
import { normalizeDecimalInput, formatPriceEur } from "@/utils/decimal";
import { z } from "zod";
import { adminOrderSchema, type AdminOrderInput } from "@/schemas/admin-order.schema";
import { adminDriverSchema } from "@/schemas/admin-driver.schema";
import { searchCustomers, type CustomerAdmin } from "@/services/customers";
import { vehicleLabel } from "@/services/vehicles";
import { type DriverAdmin } from "@/services/drivers";
import { useVehicles, useDrivers } from "@/hooks/queries";
import type { VehicleAdmin } from "@/types";
import {
  sendDriverSlipWhatsApp, sendDocuments, downloadSlipPdf,
  type CourierOrder, type ParcelOrderInput, type ServiceType, type OrderStopInput,
} from "@/services/courier";
import { createOrderInvoice } from "@/services/orders";
import { useCreateParcelOrder, useUpdateParcelOrder, useCreateDriver, useUpdateDriver } from "@/hooks/mutations";

// Inline quick-add driver sub-form reuses the driver schema's field rules (subset).
const quickDriverSchema = adminDriverSchema.pick({
  full_name: true, phone: true, email: true, vehicle_label: true, active: true,
});
type QuickDriverInput = z.infer<typeof quickDriverSchema>;

const VAT_PRESETS = ["0", "0.07", "0.19"];
// Leistungsart — English labels for the admin, German values stored & printed on the invoice.
const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "Personenbeförderung", label: "Passenger transport" },
  { value: "Kuriertransport", label: "Courier transport" },
  { value: "Umzugstransport", label: "Removal transport" },
  { value: "Sonderfahrt", label: "Special trip" },
];
// Payment-term presets — weeks-first (14/28 days). Any other term goes through "Custom…".
const TERM_OPTIONS = [
  { days: 14, label: "2 weeks" },
  { days: 28, label: "4 weeks" },
];

// Display-only issuer block for the live preview. The stored PDFs are rendered server-side
// from SiteSettings — these strings never reach the actual document.
const ISSUER = {
  name: "StepNow Rides & Movers",
  sub: "Naeem Ahmad e.K. · Blumenstraße 8, 73779 Deizisau",
  steuer: "Steuer-Nr. 59500/72609",
  bank: "IBAN DE10 1001 7997 7961 0444 47 · BIC HOLVDEB1 · Naeem Ahmad",
  foot: "StepNow Rides & Movers · Naeem Ahmad e.K. · Blumenstraße 8, 73779 Deizisau · HRA 742905 AG Stuttgart · www.step-now.de",
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const deDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const addDaysDE = (iso: string, d: number | string) => {
  if (!iso) return "—";
  const dt = new Date(iso); dt.setDate(dt.getDate() + (Number(d) || 0));
  return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const emptyStop = () => ({ company: "", address: "", plz: "", ort: "", contact_name: "", contact_phone: "", time_from: "", time_to: "", notes: "" });

function emptyDefaults(): AdminOrderInput {
  return {
    order_date: todayISO(), preferred_date: "",
    vehicle_id: "", driver_name: "", driver_id: null,
    customer_id: null, company_name: "", contact_person: "",
    street: "", plz: "", ort: "", email: "", phone: "", vat_id: "", client_reference: "",
    pickups: [emptyStop()], dropoff: emptyStop(), route_km: "", service_type: "",
    net: "", vat: "0.19",
    km_to_load: "", km_to_unload: "", km_total: "", km_occupied: "",
    surcharge_label: "", surcharge_net: "", skonto_pct: "", skonto_days: "",
    term: null, service_description: "",
  };
}

// Form values → create/update payload. Company-first customer + ordered route stops.
function toPayload(v: AdminOrderInput): ParcelOrderInput {
  const orNull = (s: string | undefined) => (s?.trim() ? s.trim() : null);
  const toStop = (s: AdminOrderInput["dropoff"], type: "pickup" | "drop"): OrderStopInput => ({
    stop_type: type,
    company: orNull(s.company),
    address: s.address.trim(),
    postcode: orNull(s.plz),
    city: orNull(s.ort),
    contact_name: orNull(s.contact_name),
    contact_phone: orNull(s.contact_phone),
    time_from: orNull(s.time_from),
    time_to: orNull(s.time_to),
    notes: orNull(s.notes),
  });
  return {
    ...(v.customer_id
      ? { customer_id: v.customer_id }
      : {
          customer: {
            company_name: v.company_name.trim(),
            contact_person: orNull(v.contact_person),
            street: orNull(v.street), plz: orNull(v.plz), ort: orNull(v.ort),
            email: v.email || null, phone: v.phone || null,
            company_vatid: v.vat_id || null, is_business: true,
          },
        }),
    // Vehicle is primary; driver is secondary. The driver field autocompletes from the active
    // drivers — when the typed name matches a real driver we link driver_id (so the order is
    // attributable to that driver); otherwise it stays a free-text name.
    vehicle_id: v.vehicle_id,
    driver_id: v.driver_id,
    driver_name: v.driver_name.trim() || null,
    client_reference: v.client_reference.trim() || null,
    service_type: v.service_type || null,
    preferred_date: v.preferred_date || null,
    stops: [...v.pickups.map((p) => toStop(p, "pickup")), toStop(v.dropoff, "drop")],
    distance_km: v.route_km ? normalizeDecimalInput(v.route_km) : null,
    total_km: v.km_total ? normalizeDecimalInput(v.km_total) : null,
    occupied_km: v.km_occupied ? normalizeDecimalInput(v.km_occupied) : null,
    km_to_load: v.km_to_load ? normalizeDecimalInput(v.km_to_load) : null,
    km_to_unload: v.km_to_unload ? normalizeDecimalInput(v.km_to_unload) : null,
    scheduled_datetime: v.order_date ? `${v.order_date}T00:00:00` : null,
    net_amount: normalizeDecimalInput(v.net)!,
    vat_rate: v.vat,
    payment_due_days: v.term ?? 14,
    service_description: v.service_description || null,
    parcel_quantity: 1,
  };
}

/** Unit-suffixed numeric input matching the admin field styling. */
function AffixInput({ unit, invalid, ...props }: { unit: string; invalid?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex">
      <input
        {...props}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-9 w-full border border-r-0 bg-white px-3 text-[13px] tabular-nums text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none",
          invalid ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
        )}
      />
      <span className={cn(
        "flex items-center border px-2.5 text-[11px] font-medium",
        invalid ? "border-rose-400 bg-rose-50 text-rose-500" : "border-slate-300 bg-slate-50 text-slate-500",
      )}>
        {unit}
      </span>
    </div>
  );
}

export default function NewTransportOrderPage() {
  const pushToast = useAdminToast((s) => s.push);

  const {
    register, handleSubmit, control, watch, setValue, getValues,
    formState: { errors },
  } = useForm<AdminOrderInput>({
    resolver: zodResolver(adminOrderSchema),
    defaultValues: emptyDefaults(),
  });

  const { fields: pickupFields, append: appendPickup, remove: removePickup } =
    useFieldArray({ control, name: "pickups" });

  // Operational fleet (plate-bearing cars) — the order is anchored to one of these. Mirrors
  // listFleetVehicles: active, not deleted, plate-bearing, sorted by plate.
  const { data: vehiclesPage } = useVehicles({ size: 100 });
  const vehicles = useMemo<VehicleAdmin[]>(() => {
    return (vehiclesPage?.items ?? [])
      .filter((v) => v.active && !v.is_deleted && !!v.plate)
      .sort((a, b) => (a.plate ?? "").localeCompare(b.plate ?? ""));
  }, [vehiclesPage]);

  // Active drivers — power the driver-name autocomplete + driver_id linkage. Locally tracked
  // so the inline add/edit mini-form can append/replace without a refetch.
  const { data: driversPage } = useDrivers({ active_only: true, size: 100 });
  const [driverOverrides, setDriverOverrides] = useState<DriverAdmin[]>([]);
  const drivers = useMemo<DriverAdmin[]>(() => {
    const base = driversPage?.items ?? [];
    const byId = new Map(base.map((d) => [d.id, d]));
    for (const d of driverOverrides) byId.set(d.id, d);
    return [...byId.values()];
  }, [driversPage, driverOverrides]);

  // ── persisted order + ui ──
  const [order, setOrder] = useState<CourierOrder | null>(null);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<"driver" | "customer">("driver");
  // VAT: presets (0/7/19) + a manual custom rate. vatPctInput holds the raw typed % so the
  // controlled field doesn't fight decimals; `vat` (the form value) stays a 0..1 fraction.
  const [vatCustom, setVatCustom] = useState(false);
  const [vatPctInput, setVatPctInput] = useState("");
  // Payment term: 2/4-week presets + a manual custom day count. termDaysInput holds the raw
  // typed days; `term` (the form value) stays the integer day count.
  const [termCustom, setTermCustom] = useState(false);
  const [termDaysInput, setTermDaysInput] = useState("");

  // ── watched form values (preview + derived) ──
  const orderDate = watch("order_date");
  const preferredDate = watch("preferred_date");
  const vehicleId = watch("vehicle_id");
  const driverName = watch("driver_name");
  const driverId = watch("driver_id");
  const companyName = watch("company_name");
  const street = watch("street");
  const plz = watch("plz");
  const ort = watch("ort");
  const email = watch("email");
  const vatId = watch("vat_id");
  const clientRef = watch("client_reference");
  const linkedId = watch("customer_id");
  const pickups = watch("pickups");
  const dropoff = watch("dropoff");
  const routeKm = watch("route_km");
  const serviceType = watch("service_type");
  const net = watch("net");
  const vat = watch("vat");
  const kmToLoad = watch("km_to_load");
  const kmToUnload = watch("km_to_unload");
  const kmGes = watch("km_total");
  const kmBes = watch("km_occupied");
  const surchargeLabel = watch("surcharge_label");
  const surchargeNet = watch("surcharge_net");
  const skontoPct = watch("skonto_pct");
  const skontoDays = watch("skonto_days");
  const term = watch("term");
  const serviceDescription = watch("service_description");
  // Kunden-Nr. of a linked saved customer (new customers get theirs assigned on save).
  const [customerNumber, setCustomerNumber] = useState<string | null>(null);

  // ── Customer search ──
  const [results, setResults] = useState<CustomerAdmin[]>([]);
  const [showNameSug, setShowNameSug] = useState(false);
  const [showPhoneSug, setShowPhoneSug] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (getValues("customer_id") || !q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(() => { void searchCustomers(q).then(setResults).catch(() => {}); }, 250);
  }, [getValues]);

  function pickCustomer(c: CustomerAdmin) {
    setValue("company_name", c.company_name); setValue("contact_person", c.contact_person ?? "");
    setValue("street", c.street ?? ""); setValue("plz", c.plz ?? ""); setValue("ort", c.ort ?? "");
    setValue("email", c.email ?? ""); setValue("phone", c.phone ?? ""); setValue("vat_id", c.company_vatid ?? "");
    setValue("customer_id", c.id, { shouldValidate: true });
    setCustomerNumber(c.customer_number ?? null);
    setShowNameSug(false); setShowPhoneSug(false); setResults([]);
  }
  function clearCustomer() {
    setValue("company_name", ""); setValue("contact_person", ""); setValue("street", "");
    setValue("plz", ""); setValue("ort", ""); setValue("email", ""); setValue("phone", "");
    setValue("vat_id", ""); setValue("customer_id", null);
    setCustomerNumber(null);
  }

  // ── Driver autocomplete ──
  const [showDriverSug, setShowDriverSug] = useState(false);
  function onDriverNameChange(value: string) {
    setValue("driver_name", value);
    setShowDriverSug(true);
    const match = drivers.find((d) => d.full_name.toLowerCase() === value.trim().toLowerCase());
    setValue("driver_id", match ? match.id : null);
  }
  function pickDriver(d: DriverAdmin) {
    setValue("driver_name", d.full_name);
    setValue("driver_id", d.id);
    setShowDriverSug(false);
  }
  // Drivers matching the typed text (name or vehicle), capped for a tidy list.
  const driverMatches = useMemo(() => {
    const q = driverName.trim().toLowerCase();
    const list = q
      ? drivers.filter(
          (d) =>
            d.full_name.toLowerCase().includes(q) ||
            (d.vehicle_label ?? "").toLowerCase().includes(q),
        )
      : drivers;
    return list.slice(0, 8);
  }, [drivers, driverName]);

  // ── Inline driver add/edit (optional) — kept as a small local sub-form ─────────────
  // If the typed name isn't a known driver → "Add"; if it matches one → "Edit". Keeps the
  // operator in the order flow instead of bouncing to the drivers screen.
  const [driverPanel, setDriverPanel] = useState<null | "add" | "edit">(null);
  const emptyDForm: QuickDriverInput = { full_name: "", phone: "", email: "", vehicle_label: "", active: true };
  const driverForm = useForm<QuickDriverInput>({ resolver: zodResolver(quickDriverSchema), defaultValues: emptyDForm });
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver(driverId || "");
  const driverSaving = createDriver.isPending || updateDriver.isPending;

  function openAddDriver() {
    driverForm.reset({ ...emptyDForm, full_name: driverName.trim() });
    setDriverPanel("add");
  }
  function openEditDriver() {
    const d = drivers.find((x) => x.id === driverId);
    if (!d) return;
    driverForm.reset({
      full_name: d.full_name,
      phone: d.phone ?? "",
      email: d.email ?? "",
      vehicle_label: d.vehicle_label ?? "",
      active: d.active,
    });
    setDriverPanel("edit");
  }
  const saveDriver = driverForm.handleSubmit(async (values) => {
    const payload = {
      full_name: values.full_name.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      vehicle_label: values.vehicle_label?.trim() || null,
      active: values.active,
    };
    try {
      if (driverPanel === "add") {
        const created = await createDriver.mutateAsync(payload);
        setDriverOverrides((prev) => [...prev, created]);
        setValue("driver_id", created.id);
        setValue("driver_name", created.full_name);
        pushToast("success", "Driver added");
      } else if (driverPanel === "edit" && driverId) {
        const updated = await updateDriver.mutateAsync(payload);
        setDriverOverrides((prev) => {
          const rest = prev.filter((x) => x.id !== updated.id);
          return [...rest, updated];
        });
        setValue("driver_name", updated.full_name);
        pushToast("success", "Driver updated");
      }
      setDriverPanel(null);
    } catch (e) {
      pushToast("error", "Could not save driver", e instanceof ApiError ? e.message : "Network error");
    }
  });

  // ── persist ──
  const createParcel = useCreateParcelOrder();
  const updateParcel = useUpdateParcelOrder();
  async function ensureSaved(values: AdminOrderInput): Promise<CourierOrder> {
    const payload = toPayload(values);
    const saved = order
      ? await updateParcel.mutateAsync({ orderId: order.id, payload })
      : await createParcel.mutateAsync(payload);
    setOrder(saved);
    if (!values.customer_id && saved.customer_id) setValue("customer_id", saved.customer_id);
    // Create-or-reuse the invoice (backend is idempotent) so the order is immediately billable.
    // Optional surcharge + Skonto are captured here and printed on the Rechnung.
    if (!hasInvoice) {
      await createOrderInvoice(saved.id, {
        surcharge_label: values.surcharge_label.trim() || undefined,
        surcharge_net: values.surcharge_net ? normalizeDecimalInput(values.surcharge_net) ?? undefined : undefined,
        skonto_pct: values.skonto_pct ? normalizeDecimalInput(values.skonto_pct) ?? undefined : undefined,
        skonto_days: values.skonto_days ? Number(values.skonto_days) || undefined : undefined,
      });
      setHasInvoice(true);
    }
    return saved;
  }

  // Each action runs through handleSubmit so zod validation gates the persist (matching the
  // original buildPayload gate). onInvalid surfaces the first error like the old toast did.
  const runAction = (key: string, fn: (saved: CourierOrder) => Promise<void> | void) =>
    handleSubmit(
      async (values) => {
        setBusy(key);
        try {
          const saved = await ensureSaved(values);
          await fn(saved);
        } catch (e) {
          pushToast("error", "Failed", e instanceof ApiError ? e.message : "Network error");
        } finally {
          setBusy(null);
        }
      },
      (formErrors) => {
        const firstErr = Object.values(formErrors)[0]?.message as string | undefined;
        pushToast("error", "Please fix the highlighted fields", firstErr);
      },
    );

  const onSave = runAction("save", () => { pushToast("success", "Saved"); });
  const onPdf = runAction("pdf", (o) => downloadSlipPdf(o.id));
  // WhatsApp: opens WhatsApp (Web on laptop, the app on mobile) with the driver's number and a
  // prefilled job briefing — the operator reviews and hits send. Backend moves draft→dispatched.
  const onWhatsApp = runAction("wa", async (o) => {
    const res = await sendDriverSlipWhatsApp(o.id);
    setOrder(res);
    if (res.whatsapp_link) {
      window.open(res.whatsapp_link, "_blank", "noopener,noreferrer");
      pushToast("success", "WhatsApp opened", "Review the prefilled message and press send.");
    } else {
      pushToast("error", "No WhatsApp link returned");
    }
  });
  // Email the driver slip (PDF) to the assigned driver.
  const onEmailDriver = runAction("mailDrv", async (o) => {
    setOrder(await sendDocuments(o.id, ["driver"]));
    pushToast("success", "Slip emailed to driver");
  });
  // Email the invoice (PDF) to the client.
  const onEmailInvoice = runAction("mailCust", async (o) => {
    setOrder(await sendDocuments(o.id, ["customer"]));
    pushToast("success", "Invoice emailed to client");
  });

  // ── derived ──
  const netNorm = useMemo(() => normalizeDecimalInput(net), [net]);
  const vehicle = vehicles.find((veh) => veh.id === vehicleId) || null;
  const fullName = companyName.trim();
  const netNum = Number(netNorm || "0");
  const rate = Number(vat) || 0;
  // Invoice net includes the optional surcharge line; the driver slip never sees money.
  const surchargeNum = Number(normalizeDecimalInput(surchargeNet) || "0");
  const invNet = netNum + surchargeNum;
  const vatAmt = invNet * rate;
  const brutto = invNet + vatAmt;
  const vatPct = +(rate * 100).toFixed(2);
  const skontoNum = Number(normalizeDecimalInput(skontoPct) || "0");
  const skontoAmt = skontoNum > 0 ? brutto * (skontoNum / 100) : 0;
  const leerKm = Math.max(0, (parseInt(kmGes) || 0) - (parseInt(kmBes) || 0));
  const money = (n: number) => formatPriceEur((Number.isFinite(n) ? n : 0).toFixed(2));
  // Days → weeks for the payment-term hint (whole weeks shown plainly, else one decimal).
  const termWeeks = term != null ? term / 7 : 0;
  const termWeeksLabel = Number.isInteger(termWeeks) ? `${termWeeks} week${termWeeks === 1 ? "" : "s"}` : `${termWeeks.toFixed(1)} weeks`;

  // ── Action-bar gating ──
  const saved = order != null;
  const canSave = !busy;
  const canPdf = saved && !busy;
  // Dispatch gating: WhatsApp/email-to-driver need an assigned driver; email-invoice needs a
  // customer email. All require the order to be saved first.
  const canWhatsApp = saved && !!driverId && !busy;
  const canEmailDriver = saved && !!driverId && !busy;
  const canEmailInvoice = saved && !!email.trim() && !busy;
  const saveTitle = !busy ? "Save the order" : "Working…";
  const pdfTitle = canPdf ? "Open the driver-slip PDF" : "Save the order first to generate its PDF";
  const waTitle = canWhatsApp ? "Open WhatsApp to the driver with a prefilled job briefing" : !saved ? "Save the order first" : "Assign a driver (with a phone number) first";
  const emailDrvTitle = canEmailDriver ? "Email the driver-slip PDF to the driver" : !saved ? "Save the order first" : "Assign a driver (with an email) first";
  const emailCustTitle = canEmailInvoice ? "Email the invoice PDF to the client" : !saved ? "Save the order first" : "Add a customer email first";

  const barHint = (() => {
    if (busy) return null;
    if (!saved) return "Save the order to unlock the PDF.";
    return null;
  })();

  const sugList = (
    <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden border border-slate-200 bg-white shadow-lg">
      {results.map((c) => (
        <button
          key={c.id}
          type="button"
          onMouseDown={() => pickCustomer(c)}
          className="flex w-full flex-col items-start gap-0.5 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
        >
          <span className="text-[12.5px] font-medium text-slate-900">{c.company_name}</span>
          <span className="text-[11px] text-slate-500">
            {[c.contact_person, c.phone, [c.plz, c.ort].filter(Boolean).join(" "), c.company_vatid].filter(Boolean).join(" · ")}
          </span>
        </button>
      ))}
    </div>
  );

  const FieldErr = ({ msg }: { msg?: string }) =>
    msg ? <p role="alert" className="mt-1 flex items-center gap-1 text-[11px] text-rose-600"><AlertCircle className="h-3 w-3" />{msg}</p> : null;

  const req = <span className="text-rose-500">*</span>;

  // Save-status pill — centered in the page header (replaces the old status strip).
  const statusPill = order ? (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700">
      <Check className="h-3 w-3" strokeWidth={3} /> Saved · <span className="font-mono text-slate-700">{order.order_number}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Draft — number assigned on save
    </span>
  );

  return (
    <>
      <AdminPageHeader
        title="New Order"
        description="Create a transport order — vehicle-centric, with logbook and billing details."
        center={statusPill}
        actions={
          <>
            <button
              type="button"
              onClick={() => setPreviewOpen((p) => !p)}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              {previewOpen ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />}
              {previewOpen ? "Hide preview" : "Show preview"}
            </button>
            <Link
              href="/admin/orders"
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              All orders
            </Link>
          </>
        }
      />

      <div className="space-y-4 p-6">
        {/* Two-pane: builder + live preview */}
        <div className={cn("grid grid-cols-1 gap-4", previewOpen && "xl:grid-cols-[1.35fr_1fr]")}>
          {/* BUILDER */}
          <div className="space-y-4">
            {/* Section 1 — Order (vehicle is the anchor, shown first) */}
            <AdminCard
              title={<span className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Order</span>}
              description="An order is always tied to a vehicle — the driver is secondary."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AdminFormField label={<span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-slate-400" /> Order date {req}</span>}>
                  <Controller
                    name="order_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker variant="admin" locale="en" value={field.value} onChange={field.onChange} invalid={!!errors.order_date} aria-label="Order date" />
                    )}
                  />
                  <FieldErr msg={errors.order_date?.message} />
                </AdminFormField>
                <AdminFormField label={<span className="flex items-center gap-1.5"><CalendarClock className="h-3 w-3 text-slate-400" /> Desired date</span>}>
                  <Controller
                    name="preferred_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker variant="admin" locale="en" value={field.value} onChange={field.onChange} aria-label="Desired date" />
                    )}
                  />
                </AdminFormField>
                <AdminFormField label={<span className="flex items-center gap-1.5"><Truck className="h-3 w-3 text-slate-900" /> Vehicle {req}</span>}>
                  <select
                    className={cn(adminInputClass, errors.vehicle_id && "border-rose-400 focus:border-rose-500")}
                    aria-invalid={!!errors.vehicle_id || undefined}
                    {...register("vehicle_id")}
                  >
                    <option value="">– Select vehicle –</option>
                    {vehicles.map((veh) => <option key={veh.id} value={veh.id}>{vehicleLabel(veh)}</option>)}
                  </select>
                  <FieldErr msg={errors.vehicle_id?.message} />
                </AdminFormField>
                <AdminFormField label={<span className="flex items-center gap-1.5"><User className="h-3 w-3 text-slate-400" /> Driver <span className="text-slate-400">(optional)</span>{driverId && <span className="text-emerald-600" title="Linked to a registered driver">· verknüpft</span>}</span>}>
                  <div className="relative">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          className={cn(adminInputClass, "pr-8")}
                          value={driverName}
                          onChange={(e) => onDriverNameChange(e.target.value)}
                          onFocus={() => setShowDriverSug(true)}
                          onBlur={() => setTimeout(() => setShowDriverSug(false), 180)}
                          placeholder="Driver name"
                          autoComplete="off"
                          role="combobox"
                          aria-expanded={showDriverSug}
                          aria-autocomplete="list"
                        />
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                      {driverId && (
                        <button
                          type="button"
                          onClick={openEditDriver}
                          className="shrink-0 rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                          title="Edit this driver"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {showDriverSug && !driverPanel && (driverMatches.length > 0 || (driverName.trim() && !driverId)) && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        <div className="max-h-60 overflow-y-auto">
                          {driverMatches.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onMouseDown={() => pickDriver(d)}
                              className={cn(
                                "flex w-full items-center gap-2.5 border-b border-slate-50 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50",
                                driverId === d.id && "bg-emerald-50/60",
                              )}
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold uppercase text-slate-600">
                                {d.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-900">
                                  {d.full_name}
                                  {!d.active && <span className="rounded bg-slate-100 px-1 text-[9px] font-semibold uppercase text-slate-400">inactive</span>}
                                </span>
                                <span className="block truncate text-[11px] text-slate-500">
                                  {[d.vehicle_label, d.phone].filter(Boolean).join(" · ") || "—"}
                                </span>
                              </span>
                              {driverId === d.id && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                            </button>
                          ))}
                          {driverMatches.length === 0 && (
                            <div className="px-3 py-2 text-[11.5px] text-slate-400">No drivers match “{driverName.trim()}”.</div>
                          )}
                        </div>
                        {driverName.trim() && !driverId && (
                          <button
                            type="button"
                            onMouseDown={openAddDriver}
                            className="flex w-full items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2 text-left text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">+</span>
                            Add “{driverName.trim()}” as a new driver
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {driverPanel && (
                    <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50/70 p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {driverPanel === "add" ? "New driver" : "Edit driver"}
                        </div>
                        {driverPanel === "edit" && driverId && (
                          <Link
                            href={`/admin/drivers/${driverId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                            title="Open the full driver profile (licence, P-Schein, compliance) in a new tab"
                          >
                            Full edit <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <input
                        className={adminInputClass}
                        {...driverForm.register("full_name")}
                        placeholder="Full name *"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className={adminInputClass}
                          {...driverForm.register("phone")}
                          placeholder="Phone"
                        />
                        <input
                          className={adminInputClass}
                          {...driverForm.register("email")}
                          placeholder="Email"
                        />
                      </div>
                      <input
                        className={adminInputClass}
                        {...driverForm.register("vehicle_label")}
                        placeholder="Vehicle label (e.g. SN 1122)"
                      />
                      <label className="flex items-center gap-1.5 text-[12px] text-slate-600">
                        <input
                          type="checkbox"
                          {...driverForm.register("active")}
                        />
                        Active
                      </label>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={saveDriver}
                          disabled={driverSaving || !driverForm.watch("full_name")?.trim()}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {driverSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          {driverPanel === "add" ? "Add driver" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDriverPanel(null)}
                          className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </AdminFormField>
              </div>
            </AdminCard>

            {/* Section 2 — Customer */}
            <AdminCard
              title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Customer / Client</span>}
              description="Search a saved company by name or phone, or add a new one."
              headerActions={linkedId ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 px-2 py-1 text-[10.5px] font-semibold text-emerald-700">
                  <Check className="h-3 w-3" strokeWidth={3} /> Saved customer
                  <button type="button" onClick={clearCustomer} title="Unlink / new" className="ml-0.5 text-emerald-700 hover:text-emerald-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : undefined}
            >
              <div className="space-y-3">
                <div className="relative grid gap-3 sm:grid-cols-2">
                  <AdminFormField label={<span className="flex items-center gap-1.5"><User className="h-3 w-3 text-slate-400" /> Company name {req}</span>}>
                    <input
                      className={cn(adminInputClass, errors.company_name && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!errors.company_name || undefined}
                      value={companyName}
                      placeholder="Type to search or add a company…"
                      onChange={(e) => { setValue("company_name", e.target.value); setValue("customer_id", null); setShowNameSug(true); runSearch(e.target.value); }}
                      onFocus={() => setShowNameSug(true)}
                      onBlur={() => setTimeout(() => setShowNameSug(false), 180)}
                    />
                    <FieldErr msg={errors.company_name?.message} />
                  </AdminFormField>
                  <AdminFormField label="Contact person">
                    <input className={adminInputClass} {...register("contact_person")} placeholder="Ansprechpartner (optional)" />
                  </AdminFormField>
                  {showNameSug && results.length > 0 && sugList}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative">
                    <AdminFormField label={<span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> Phone</span>}>
                      <input
                        className={adminInputClass}
                        {...register("phone")}
                        onChange={(e) => { setValue("phone", e.target.value); setValue("customer_id", null); setShowPhoneSug(true); runSearch(e.target.value); }}
                        onFocus={() => setShowPhoneSug(true)}
                        onBlur={() => setTimeout(() => setShowPhoneSug(false), 180)}
                        placeholder="+49 …"
                      />
                    </AdminFormField>
                    {showPhoneSug && results.length > 0 && sugList}
                  </div>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Hash className="h-3 w-3 text-slate-400" /> Client ref. no.</span>}>
                    <input className={adminInputClass} {...register("client_reference")} placeholder="e.g. 000358066" />
                  </AdminFormField>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> Email</span>}>
                    <input
                      className={cn(adminInputClass, errors.email && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!errors.email || undefined}
                      {...register("email")}
                      placeholder="customer@company.de"
                    />
                    <FieldErr msg={errors.email?.message} />
                  </AdminFormField>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <AdminFormField label="Street"><input className={adminInputClass} {...register("street")} placeholder="Street & no." /></AdminFormField>
                  <AdminFormField label="Postcode"><input className={adminInputClass} {...register("plz")} placeholder="73207" /></AdminFormField>
                  <AdminFormField label="City"><input className={adminInputClass} {...register("ort")} placeholder="Plochingen" /></AdminFormField>
                  <AdminFormField label="VAT ID"><input className={adminInputClass} {...register("vat_id")} placeholder="DE… (B2B)" /></AdminFormField>
                </div>
              </div>
            </AdminCard>

            {/* Section 3 — Route */}
            <AdminCard title={<span className="flex items-center gap-2"><RouteIcon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Route</span>}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    <MapPin className="h-3 w-3" /> Pickups (Abholung) — one or more collection points {req}
                  </p>
                  {pickupFields.map((f, i) => (
                    <div key={f.id} className="space-y-2 border border-slate-200 bg-slate-50/40 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-emerald-700">Beladeort {pickupFields.length > 1 ? i + 1 : ""}</span>
                        <button
                          type="button"
                          onClick={() => removePickup(i)}
                          disabled={pickupFields.length === 1}
                          title="Remove pickup"
                          className="ml-auto inline-flex h-7 w-7 items-center justify-center border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input className={adminInputClass} {...register(`pickups.${i}.company`)} placeholder="Firma / Company (optional)" />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_1fr]">
                        <input
                          className={cn(adminInputClass, errors.pickups?.[i]?.address && "border-rose-400 focus:border-rose-500")}
                          aria-invalid={!!errors.pickups?.[i]?.address || undefined}
                          {...register(`pickups.${i}.address`)}
                          placeholder={`Pickup ${i + 1} — street & no.`}
                        />
                        <input className={adminInputClass} {...register(`pickups.${i}.plz`)} placeholder="PLZ" />
                        <input className={adminInputClass} {...register(`pickups.${i}.ort`)} placeholder="City" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[140px_140px]">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-500">von <input type="time" className={adminInputClass} {...register(`pickups.${i}.time_from`)} /></label>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-500">bis <input type="time" className={adminInputClass} {...register(`pickups.${i}.time_to`)} /></label>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendPickup(emptyStop())}
                    className="inline-flex items-center gap-1.5 border border-dashed border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[12px] leading-none text-white">+</span> Add pickup
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-600">
                    <MapPin className="h-3 w-3" /> Drop-off (Ziel) — single destination {req}
                  </p>
                  <div className="space-y-2 border border-slate-200 bg-slate-50/40 p-2.5">
                    <input className={adminInputClass} {...register("dropoff.company")} placeholder="Firma / Company (optional)" />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_1fr]">
                      <input
                        className={cn(adminInputClass, errors.dropoff?.address && "border-rose-400 focus:border-rose-500")}
                        aria-invalid={!!errors.dropoff?.address || undefined}
                        {...register("dropoff.address")}
                        placeholder="Destination — street & no."
                      />
                      <input className={adminInputClass} {...register("dropoff.plz")} placeholder="PLZ" />
                      <input className={adminInputClass} {...register("dropoff.ort")} placeholder="City" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[140px_140px]">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500">von <input type="time" className={adminInputClass} {...register("dropoff.time_from")} /></label>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500">bis <input type="time" className={adminInputClass} {...register("dropoff.time_to")} /></label>
                    </div>
                  </div>
                  <FieldErr msg={errors.dropoff?.address?.message} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Gauge className="h-3 w-3 text-slate-400" /> KM (total route)</span>}>
                    <Controller
                      name="route_km"
                      control={control}
                      render={({ field }) => (
                        <AffixInput unit="km" type="number" min={0} step={1} value={field.value} onChange={field.onChange} placeholder="0" />
                      )}
                    />
                  </AdminFormField>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Tag className="h-3 w-3 text-slate-400" /> Service type</span>}>
                    <select className={adminInputClass} {...register("service_type")}>
                      <option value="">– Select –</option>
                      {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </AdminFormField>
                </div>
              </div>
            </AdminCard>

            {/* Section 4 — Pricing */}
            <AdminCard
              title={<span className="flex items-center gap-2"><Receipt className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Pricing</span>}
              description="Price shows on the invoice only — never on the driver order."
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <AdminFormField label={<span>Net amount (€) {req}</span>}>
                    <Controller
                      name="net"
                      control={control}
                      render={({ field }) => (
                        <AffixInput unit="EUR" type="number" value={field.value} invalid={!!errors.net} onChange={field.onChange} placeholder="0.00" />
                      )}
                    />
                    <FieldErr msg={errors.net?.message} />
                  </AdminFormField>
                  <AdminFormField label="VAT">
                    {vatCustom ? (
                      // "Custom…" turns this same field into a typeable % input (chevron reverts).
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <AffixInput
                            unit="%"
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={vatPctInput}
                            invalid={!!errors.vat}
                            onChange={(e) => {
                              setVatPctInput(e.target.value);
                              const pct = Number(e.target.value);
                              setValue("vat", e.target.value.trim() && Number.isFinite(pct) ? String(pct / 100) : "", { shouldValidate: true });
                            }}
                            placeholder="e.g. 10.5"
                            aria-label="Custom VAT percentage"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => { setVatCustom(false); setValue("vat", "0.19", { shouldValidate: true }); }}
                          title="Back to preset rates"
                          aria-label="Back to preset VAT rates"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        className={adminInputClass}
                        value={vat}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setVatCustom(true);
                            setVatPctInput(vat ? String(+(Number(vat) * 100).toFixed(2)) : "");
                          } else {
                            setValue("vat", e.target.value, { shouldValidate: true });
                          }
                        }}
                      >
                        {VAT_PRESETS.map((val) => <option key={val} value={val}>{Math.round(Number(val) * 100)}%</option>)}
                        <option value="custom">Custom…</option>
                      </select>
                    )}
                    <FieldErr msg={errors.vat?.message} />
                  </AdminFormField>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-slate-400" /> Payment term {req}</span>}>
                    {termCustom ? (
                      // "Custom…" turns this same field into a typeable days input (chevron reverts).
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <AffixInput
                            unit="days"
                            type="number"
                            min={1}
                            step={1}
                            value={termDaysInput}
                            invalid={!!errors.term}
                            onChange={(e) => {
                              setTermDaysInput(e.target.value);
                              const d = parseInt(e.target.value);
                              setValue("term", e.target.value.trim() && Number.isFinite(d) && d > 0 ? d : null, { shouldValidate: true });
                            }}
                            placeholder="e.g. 45"
                            aria-label="Custom payment term in days"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => { setTermCustom(false); setTermDaysInput(""); setValue("term", null, { shouldValidate: true }); }}
                          title="Back to preset terms"
                          aria-label="Back to preset payment terms"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        className={cn(adminInputClass, errors.term && "border-rose-400 focus:border-rose-500")}
                        aria-invalid={!!errors.term || undefined}
                        value={term != null ? String(term) : ""}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setTermCustom(true);
                            setTermDaysInput(term != null ? String(term) : "");
                          } else {
                            setValue("term", Number(e.target.value), { shouldValidate: true });
                          }
                        }}
                      >
                        <option value="" disabled>– Select term –</option>
                        {TERM_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
                        <option value="custom">Custom…</option>
                      </select>
                    )}
                    {term != null && orderDate ? (
                      <p className="mt-1.5 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">≈ {termWeeksLabel} · due {addDaysDE(orderDate, term)}</p>
                    ) : (
                      <FieldErr msg={errors.term?.message} />
                    )}
                  </AdminFormField>
                </div>

                {/* Live calc row — Net / VAT / Gross / Status */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">Net</p>
                    <p className="mt-0.5 font-mono text-[14px] tabular-nums text-slate-900">{money(netNum)}</p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">VAT {vatPct}%</p>
                    <p className="mt-0.5 font-mono text-[14px] tabular-nums text-slate-900">{money(vatAmt)}</p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">Gross</p>
                    <p className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-emerald-700">{money(brutto)}</p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-amber-600">Status</p>
                    <p className="mt-0.5 text-[14px] font-semibold text-amber-700">Open</p>
                  </div>
                </div>

                {/* Optional surcharge + Skonto (early-payment discount) — printed on the invoice */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <AdminFormField label="Surcharge label (Zuschlag)">
                    <input className={adminInputClass} {...register("surcharge_label")} placeholder="e.g. Wartezeit" />
                  </AdminFormField>
                  <AdminFormField label="Surcharge net (€)">
                    <Controller name="surcharge_net" control={control}
                      render={({ field }) => <AffixInput unit="EUR" type="number" min={0} step="0.01" value={field.value} onChange={field.onChange} placeholder="0.00" />} />
                  </AdminFormField>
                  <AdminFormField label="Skonto (%)">
                    <Controller name="skonto_pct" control={control}
                      render={({ field }) => <AffixInput unit="%" type="number" min={0} max={100} step={0.5} value={field.value} onChange={field.onChange} placeholder="e.g. 5" />} />
                  </AdminFormField>
                  <AdminFormField label="Skonto within (days)">
                    <Controller name="skonto_days" control={control}
                      render={({ field }) => <AffixInput unit="days" type="number" min={0} step={1} value={field.value} onChange={field.onChange} placeholder="e.g. 7" />} />
                  </AdminFormField>
                </div>
                {skontoAmt > 0 && skontoDays && (
                  <p className="bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                    Skonto: bei Zahlung binnen {skontoDays} Tagen {skontoNum}% = {money(skontoAmt)} Abzug.
                  </p>
                )}
              </div>
            </AdminCard>

            {/* Section 5 — Logbook */}
            <AdminCard
              title={<span className="flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Logbook (km)</span>}
              description="Km to load · Km to unload · driven · occupied (Besetzt). Empty km is derived (driven − occupied)."
            >
              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <AdminFormField label="Km to load">
                  <Controller name="km_to_load" control={control}
                    render={({ field }) => <AffixInput unit="km" type="number" min={0} step={1} value={field.value} onChange={field.onChange} placeholder="0" />} />
                </AdminFormField>
                <AdminFormField label="Km to unload">
                  <Controller name="km_to_unload" control={control}
                    render={({ field }) => <AffixInput unit="km" type="number" min={0} step={1} value={field.value} onChange={field.onChange} placeholder="0" />} />
                </AdminFormField>
                <AdminFormField label="Driven km">
                  <Controller name="km_total" control={control}
                    render={({ field }) => <AffixInput unit="km" type="number" min={0} step={1} value={field.value} onChange={field.onChange} placeholder="0" />} />
                </AdminFormField>
                <AdminFormField label="Occupied (Besetzt)">
                  <Controller name="km_occupied" control={control}
                    render={({ field }) => <AffixInput unit="km" type="number" min={0} step={1} value={field.value} onChange={field.onChange} placeholder="0" />} />
                </AdminFormField>
                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Empty</span>
                  <span className="font-mono text-[14px] font-semibold tabular-nums text-slate-900">{leerKm} km</span>
                </div>
              </div>
            </AdminCard>

            {/* Section 6 — Service description (payment term now lives in Pricing) */}
            <AdminCard
              title={<span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Service description</span>}
              description="Printed on the invoice line item (§ 14 UStG)."
            >
              <AdminFormField label="Service description (§ 14 UStG)">
                <textarea
                  className={cn(adminInputClass, "h-auto py-2")}
                  rows={3}
                  {...register("service_description")}
                  placeholder="Detailed description of the service…"
                />
              </AdminFormField>
            </AdminCard>
          </div>

          {/* LIVE PREVIEW — German, mirrors the real PDF output */}
          {previewOpen && (
            <div className="xl:sticky xl:top-4 xl:self-start">
              <AdminCard
                eyebrow="Live preview"
                title={previewMode === "driver" ? "Driver slip" : "Invoice"}
                serif
                headerActions={
                  <div className="flex overflow-hidden border border-slate-300">
                    <button type="button" onClick={() => setPreviewMode("driver")} className={cn("flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold", previewMode === "driver" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                      <Truck className="h-3 w-3" /> Driver slip
                    </button>
                    <button type="button" onClick={() => setPreviewMode("customer")} className={cn("flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold", previewMode === "customer" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                      <Receipt className="h-3 w-3" /> Invoice
                    </button>
                  </div>
                }
              >
                <div className="border border-slate-200 bg-white p-5 text-[13px] leading-relaxed text-slate-700 shadow-sm">
                  {/* Issuer header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 place-items-center bg-slate-900 text-[13px] font-semibold text-white">SN</div>
                      <div>
                        <p className="font-serif text-[15px] font-medium leading-tight text-slate-900">{ISSUER.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{ISSUER.sub}</p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] leading-relaxed text-slate-500">
                      <p className="font-serif text-[16px] font-medium uppercase tracking-wide text-slate-900">
                        {previewMode === "driver" ? "Transportauftrag" : "Rechnung"}
                      </p>
                      <p className="font-mono text-[12.5px] text-slate-700">
                        {order?.order_number ? `${previewMode === "driver" ? "A-" : "R"}${order.order_number}` : "—"}
                      </p>
                      <p>{deDate(orderDate)}</p>
                      {previewMode === "customer" && <p>{ISSUER.steuer}</p>}
                    </div>
                  </div>

                  {previewMode === "driver" ? (
                    <>
                      {/* Vehicle is the anchor — shown first and most prominent */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 bg-slate-900 px-3.5 py-2.5 text-white">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300"><Truck className="h-3 w-3" /> Fahrzeug</span>
                        {vehicle
                          ? <span className="text-[13px] font-semibold text-white">{vehicleLabel(vehicle)}</span>
                          : <span className="text-[13px] italic text-slate-400">Noch nicht gewählt</span>}
                        {driverName && <span className="ml-auto text-[12px] text-slate-300">Fahrer: <strong className="text-white">{driverName}</strong></span>}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Beladeort{pickups.length > 1 ? ` (${pickups.length})` : ""}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold">Datum &amp; Uhrzeit:</span> {deDate(preferredDate || orderDate)}
                            {pickups[0]?.time_from ? ` · ${pickups[0].time_from}${pickups[0]?.time_to ? `–${pickups[0].time_to}` : ""} Uhr` : ""}
                          </p>
                          {pickups.some((p) => p.address.trim() || p.company?.trim()) ? (
                            <ol className="mt-1 space-y-0.5">
                              {pickups.map((p, i) => (
                                <li key={i} className="text-[12.5px] font-medium leading-snug text-slate-900">
                                  {(pickups.length > 1 ? `${i + 1}. ` : "")}
                                  {[p.company, p.address, [p.plz, p.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—"}
                                </li>
                              ))}
                            </ol>
                          ) : <p className="mt-1 text-[12.5px] italic text-slate-400">—</p>}
                        </div>
                        <div className="border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-600">Entladeort</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold">Datum &amp; Uhrzeit:</span> {deDate(preferredDate || orderDate)}
                            {dropoff.time_from ? ` · ${dropoff.time_from}${dropoff.time_to ? `–${dropoff.time_to}` : ""} Uhr` : ""}
                          </p>
                          <p className="mt-1 text-[12.5px] font-medium leading-snug text-slate-900">
                            {[dropoff.company, dropoff.address, [dropoff.plz, dropoff.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") || <span className="italic text-slate-400">—</span>}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 border border-dashed border-slate-300 px-3.5 py-2.5 text-[12px] text-slate-500">
                        <span>Auftraggeber: <strong className="text-slate-900">{fullName || "—"}</strong></span>
                        <span>Strecke: <strong className="text-slate-900">{routeKm ? `${routeKm} km` : "—"}</strong></span>
                      </div>
                      {serviceType && (
                        <p className="mt-3 text-[12px] text-slate-600"><span className="font-semibold text-slate-900">Leistungsart:</span> {serviceType}</p>
                      )}
                      {serviceDescription && (
                        <p className="mt-1 text-[12px] text-slate-600">{serviceDescription}</p>
                      )}
                      <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10.5px] text-slate-500">
                        {[["Km to load", kmToLoad], ["Km to Unload", kmToUnload], ["driven Km", kmGes], ["Besetzt", kmBes], ["Leer", `${leerKm}`]].map(([lbl, val]) => (
                          <div key={lbl as string} className="border border-slate-200 px-1 py-1.5">
                            <p className="uppercase tracking-[0.06em]">{lbl}</p>
                            <p className="mt-0.5 font-mono text-[12px] font-semibold text-slate-800">{val ? `${val} km` : "—"}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 grid grid-cols-2 gap-6">
                        <div className="border-t border-slate-900 pt-1.5 text-[11px] font-semibold text-slate-500">Unterschrift Fahrer</div>
                        <div className="border-t border-slate-900 pt-1.5 text-[11px] font-semibold text-slate-500">Unterschrift Auftraggeber</div>
                      </div>
                      <p className="mt-4 text-center text-[11px] italic text-slate-500">Belegart Transportauftrag — enthält bewusst keine Preisangaben.</p>
                    </>
                  ) : (
                    <>
                      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Rechnung an</p>
                          <div className="mt-1.5 text-[13px] leading-relaxed">
                            {fullName ? (
                              <>
                                <strong className="text-[14px] text-slate-900">{fullName}</strong>
                                {street && <div>{street}</div>}
                                {(plz || ort) && <div>{plz} {ort}</div>}
                                {vatId && <div className="mt-0.5 text-[11px] text-slate-500">USt-IdNr: {vatId}</div>}
                              </>
                            ) : <span className="italic text-slate-400">Kunde wählen…</span>}
                          </div>
                        </div>
                        <dl className="min-w-[190px] space-y-1 text-[12px]">
                          <div className="flex justify-between gap-6"><dt className="text-slate-500">Kunden-Nr.</dt><dd className="text-slate-800">{customerNumber ?? (linkedId ? "—" : "wird vergeben")}</dd></div>
                          <div className="flex justify-between gap-6"><dt className="text-slate-500">Rechnungs-Nr.</dt><dd className="font-mono text-slate-800">{order?.order_number ? `R${order.order_number}` : "—"}</dd></div>
                          <div className="flex justify-between gap-6"><dt className="text-slate-500">Datum</dt><dd className="text-slate-800">{deDate(orderDate)}</dd></div>
                          {clientRef && <div className="flex justify-between gap-6"><dt className="text-slate-500">Referenz-Nr.</dt><dd className="text-slate-800">{clientRef}</dd></div>}
                        </dl>
                      </div>

                      <p className="mt-4 text-[12px] leading-relaxed text-slate-600">
                        Sehr geehrte Damen und Herren, vielen Dank für Ihren Auftrag. Für die Transportleistung vom{" "}
                        <strong className="text-slate-900">{deDate(preferredDate || orderDate)}</strong>
                        {" "}({pickups[0]?.ort || pickups[0]?.address || "—"} nach {dropoff.ort || dropoff.address || "—"}) stellen wir folgende Rechnung:
                      </p>

                      <table className="mt-4 w-full border-collapse">
                        <thead><tr className="border-b-2 border-slate-900 text-[10px] uppercase tracking-wide text-slate-500">
                          <th className="py-1.5 pr-2 text-left font-semibold">Pos.</th>
                          <th className="py-1.5 pr-2 text-left font-semibold">Beschreibung</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">Einzelpreis</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">MwSt</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">Gesamtpreis</th>
                        </tr></thead>
                        <tbody>
                          <tr className="border-b border-slate-100 align-top">
                            <td className="py-2.5 pr-2 text-[13px]">1</td>
                            <td className="py-2.5 pr-2 text-[13px]">
                              <strong className="text-slate-900">{serviceType || "Transportleistung"}</strong>
                              {(pickups[0]?.address || dropoff.address) && <div className="text-[11px] text-slate-500">{(pickups[0]?.ort || pickups[0]?.address || "—") + " → " + (dropoff.ort || dropoff.address || "—")}</div>}
                              {serviceDescription && <div className="text-[11px] text-slate-500">{serviceDescription}</div>}
                            </td>
                            <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{money(netNum)}</td>
                            <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{vatPct}%</td>
                            <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{money(netNum * (1 + rate))}</td>
                          </tr>
                          {surchargeNum > 0 && (
                            <tr className="border-b border-slate-100 align-top">
                              <td className="py-2.5 pr-2 text-[13px]">2</td>
                              <td className="py-2.5 pr-2 text-[13px]"><strong className="text-slate-900">{surchargeLabel || "Zuschlag"}</strong></td>
                              <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{money(surchargeNum)}</td>
                              <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{vatPct}%</td>
                              <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{money(surchargeNum * (1 + rate))}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="mt-4 flex justify-end">
                        <div className="w-64 text-[13px]">
                          <div className="flex justify-between py-0.5"><span className="text-slate-500">Summe Netto</span><span className="font-mono">{money(invNet)}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-500">zzgl. USt. {vatPct}%</span><span className="font-mono">{money(vatAmt)}</span></div>
                          <div className="mt-1 flex justify-between border-t-2 border-slate-900 bg-slate-50 px-2 py-2 text-[15px] font-semibold text-slate-900"><span>Gesamtbetrag</span><span className="font-mono">{money(brutto)}</span></div>
                        </div>
                      </div>

                      {skontoAmt > 0 && skontoDays && (
                        <p className="mt-3 text-[12px] text-slate-600">Skonto: Bei Zahlung binnen {skontoDays} Tagen {skontoNum}% = <strong className="text-slate-900">{money(skontoAmt)}</strong> Abzug möglich.</p>
                      )}

                      <p className="mt-4 text-[12px] font-semibold text-slate-700">Zahlungsbedingungen</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                        Bitte überweisen Sie den Rechnungsbetrag von <strong className="text-slate-900">{money(brutto)}</strong> innerhalb von {term ?? 0} Tagen ohne Abzug.
                        Verwendungszweck: Rechnungsnummer <span className="font-mono">{order?.order_number ? `R${order.order_number}` : "—"}</span>.
                        {" "}Fälligkeitsdatum: <strong className="text-slate-900">{term != null ? addDaysDE(orderDate, term) : "—"}</strong>.
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">{ISSUER.bank}</p>
                      <p className="mt-3 text-[12px] text-slate-700">Mit freundlichen Grüßen<br />Naeem Ahmad</p>
                    </>
                  )}

                  <div className="-mx-5 -mb-5 mt-5 bg-slate-900 px-5 py-2.5 text-center text-[10px] text-slate-300">{ISSUER.foot}</div>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Layout preview only — the issued PDF is rendered from your business settings.
                </p>
              </AdminCard>
            </div>
          )}
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
          {barHint && (
            <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:inline-flex">
              <AlertCircle className="h-3 w-3" /> {barHint}
            </span>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              title={saveTitle}
              aria-disabled={!canSave}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
                canSave
                  ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />} {order ? "Update" : "Save order"}
            </button>

            <button
              type="button"
              onClick={onPdf}
              disabled={!canPdf}
              title={pdfTitle}
              aria-disabled={!canPdf}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
                canPdf
                  ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} />} Driver slip PDF
            </button>

            {/* WhatsApp the driver (opens WhatsApp Web / mobile app, prefilled) */}
            <button
              type="button"
              onClick={onWhatsApp}
              disabled={!canWhatsApp}
              title={waTitle}
              aria-disabled={!canWhatsApp}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
                canWhatsApp
                  ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              {busy === "wa" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />} WhatsApp driver
            </button>

            {/* Email the driver slip */}
            <button
              type="button"
              onClick={onEmailDriver}
              disabled={!canEmailDriver}
              title={emailDrvTitle}
              aria-disabled={!canEmailDriver}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
                canEmailDriver
                  ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              {busy === "mailDrv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />} Email slip
            </button>

            {/* Email the invoice to the client */}
            <button
              type="button"
              onClick={onEmailInvoice}
              disabled={!canEmailInvoice}
              title={emailCustTitle}
              aria-disabled={!canEmailInvoice}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
                canEmailInvoice
                  ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              {busy === "mailCust" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5" strokeWidth={1.5} />} Email invoice
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
