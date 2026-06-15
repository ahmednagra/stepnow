// app/admin/(authed)/orders/new/page.tsx
// New transport-order console, modelled on the local StepNow_Buchhaltung tool. An order is
// anchored to a VEHICLE first (the primary identifier) and a free-text driver second. Two-pane
// builder (Order · Customer · Route · Pricing · Logbook · Payment) with a live driver-slip /
// invoice preview and a sticky action bar. The admin chrome is English; the document preview
// stays German because it mirrors the real German PDFs rendered server-side. Built entirely on
// the admin design system (AdminPageHeader / AdminCard / AdminFormField + Tailwind tokens).
//
// All capture fields persist to real order columns (vehicle_id/vehicle_name, driver_name,
// client_reference, service_type, preferred_date, distance_km, total_km, occupied_km) — not a
// packed internal_notes blob.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  User, Mail, Phone, MapPin, ArrowRight, ArrowLeft, Truck, Route as RouteIcon, Gauge,
  CalendarDays, CalendarClock, Hash, Receipt, Check, X, Eye, EyeOff, Save, FileDown,
  Loader2, AlertCircle, Tag, ClipboardList, ChevronDown, MessageCircle,
} from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass } from "@/components/admin";
import { DatePicker } from "@/components/ui";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { cn } from "@/utils/cn";
import { normalizeDecimalInput, formatPriceEur } from "@/utils/decimal";
import { searchCustomers, type CustomerAdmin } from "@/services/customers";
import { listFleetVehicles, vehicleLabel } from "@/services/vehicles";
import {
  listAdminDrivers, createAdminDriver, updateAdminDriver, type DriverAdmin,
} from "@/services/drivers";
import type { VehicleAdmin } from "@/types";
import {
  createParcelOrder, updateParcelOrder, sendDriverSlipWhatsApp, sendDocuments,
  type CourierOrder, type ParcelOrderInput, type ServiceType,
} from "@/services/courier";
import { createOrderInvoice } from "@/services/orders";

const VAT_PRESETS = ["0", "0.07", "0.19"];
// Leistungsart — English labels for the admin, German values stored & printed on the invoice.
const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "Personenbeförderung", label: "Passenger transport" },
  { value: "Kuriertransport", label: "Courier transport" },
  { value: "Umzugstransport", label: "Removal transport" },
  { value: "Sonderfahrt", label: "Special trip" },
];
// Payment-term chips — the only three terms the business offers (matches the HTML tool).
const TERM_CHIPS = [
  { days: 15, label: "2 weeks", sub: "15 days" },
  { days: 30, label: "4 weeks", sub: "30 days" },
  { days: 45, label: "6 weeks", sub: "45 days" },
];

// Display-only issuer block for the live preview. The stored PDFs are rendered server-side
// from SiteSettings — these strings never reach the actual document.
const ISSUER = {
  name: "StepNow Rides & Movers",
  sub: "Naeem Ahmad e.K. · Plochingen/Esslingen",
  steuer: "Steuer-Nr. 59500/72609",
  bank: "IBAN DE12 6005 0101 0001 2345 67 · BIC SOLADEST600 · Kreissparkasse Esslingen",
  foot: "StepNow Rides & Movers · Naeem Ahmad e.K. · Blumenstraße 8, 73779 Deizisau · +49 (0) 1590 1225850 · rides@step-now.de",
};

// Loose but practical email check — mirrors what the backend will accept.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const todayISO = () => new Date().toISOString().slice(0, 10);
const deDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const addDaysDE = (iso: string, d: number | string) => {
  if (!iso) return "—";
  const dt = new Date(iso); dt.setDate(dt.getDate() + (Number(d) || 0));
  return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

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

  // ── Section 1 — Order header ──
  const [orderDate, setOrderDate] = useState(todayISO());   // order date
  const [preferredDate, setPreferredDate] = useState("");   // desired date
  const [vehicles, setVehicles] = useState<VehicleAdmin[]>([]);
  const [vehicleId, setVehicleId] = useState("");           // vehicle ★ (primary)
  const [drivers, setDrivers] = useState<DriverAdmin[]>([]); // active drivers for autocomplete
  const [driverName, setDriverName] = useState("");         // driver (secondary)
  const [driverId, setDriverId] = useState<string | null>(null); // linked when name matches

  // ── Section 2 — Customer ──
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [street, setStreet] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vatId, setVatId] = useState("");
  const [clientRef, setClientRef] = useState("");           // client reference number
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [results, setResults] = useState<CustomerAdmin[]>([]);
  const [showNameSug, setShowNameSug] = useState(false);
  const [showPhoneSug, setShowPhoneSug] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Section 3 — Route ──
  const [pickup, setPickup] = useState("");                 // pickup address
  const [dropoff, setDropoff] = useState("");               // destination address
  const [routeKm, setRouteKm] = useState("");               // KM (pickup→destination) → distance_km
  const [serviceType, setServiceType] = useState<ServiceType | "">("");

  // ── Section 4 — Pricing ──
  const [net, setNet] = useState("");
  const [vat, setVat] = useState("0.19");

  // ── Section 5 — Logbook ──
  const [kmGes, setKmGes] = useState("");                   // total km driven → total_km
  const [kmBes, setKmBes] = useState("");                   // occupied km → occupied_km

  // ── Section 6 — Payment term + description ──
  const [term, setTerm] = useState<number | null>(null);    // 15 / 30 / 45
  const [serviceDescription, setServiceDescription] = useState("");

  // ── persisted order + ui ──
  const [order, setOrder] = useState<CourierOrder | null>(null);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<"driver" | "customer">("driver");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    // Operational fleet (plate-bearing cars) — the order is anchored to one of these.
    listFleetVehicles().then(setVehicles).catch(() => {});
    // Active drivers — power the driver-name autocomplete + driver_id linkage.
    listAdminDrivers({ active_only: true, size: 100 })
      .then((r) => setDrivers(r.items))
      .catch(() => {});
  }, []);

  // Resolve free-text driver input to a real driver_id when the name matches (case-insensitive).
  const [showDriverSug, setShowDriverSug] = useState(false);
  function onDriverNameChange(value: string) {
    setDriverName(value);
    setShowDriverSug(true);
    const match = drivers.find(
      (d) => d.full_name.toLowerCase() === value.trim().toLowerCase(),
    );
    setDriverId(match ? match.id : null);
  }
  function pickDriver(d: DriverAdmin) {
    setDriverName(d.full_name);
    setDriverId(d.id);
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

  // ── Inline driver add/edit (optional) ───────────────────────────────
  // If the typed name isn't a known driver → "Add"; if it matches one → "Edit". Keeps the
  // operator in the order flow instead of bouncing to the drivers screen.
  const [driverPanel, setDriverPanel] = useState<null | "add" | "edit">(null);
  const [driverSaving, setDriverSaving] = useState(false);
  const emptyDForm = { full_name: "", phone: "", email: "", vehicle_label: "", active: true };
  const [dForm, setDForm] = useState(emptyDForm);

  function openAddDriver() {
    setDForm({ ...emptyDForm, full_name: driverName.trim() });
    setDriverPanel("add");
  }
  function openEditDriver() {
    const d = drivers.find((x) => x.id === driverId);
    if (!d) return;
    setDForm({
      full_name: d.full_name,
      phone: d.phone ?? "",
      email: d.email ?? "",
      vehicle_label: d.vehicle_label ?? "",
      active: d.active,
    });
    setDriverPanel("edit");
  }
  async function saveDriver() {
    if (!dForm.full_name.trim()) {
      pushToast("error", "Driver name is required");
      return;
    }
    setDriverSaving(true);
    const payload = {
      full_name: dForm.full_name.trim(),
      phone: dForm.phone.trim() || null,
      email: dForm.email.trim() || null,
      vehicle_label: dForm.vehicle_label.trim() || null,
      active: dForm.active,
    };
    try {
      if (driverPanel === "add") {
        const created = await createAdminDriver(payload);
        setDrivers((prev) => [...prev, created]);
        setDriverId(created.id);
        setDriverName(created.full_name);
        pushToast("success", "Driver added");
      } else if (driverPanel === "edit" && driverId) {
        const updated = await updateAdminDriver(driverId, payload);
        setDrivers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        setDriverName(updated.full_name);
        pushToast("success", "Driver updated");
      }
      setDriverPanel(null);
    } catch (e) {
      pushToast("error", "Could not save driver", e instanceof ApiError ? e.message : "Network error");
    } finally {
      setDriverSaving(false);
    }
  }

  const runSearch = useCallback((q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (linkedId || !q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(() => { void searchCustomers(q).then(setResults).catch(() => {}); }, 250);
  }, [linkedId]);

  function pickCustomer(c: CustomerAdmin) {
    setFirst(c.first_name); setLast(c.last_name);
    setStreet(c.street ?? ""); setPlz(c.plz ?? ""); setOrt(c.ort ?? "");
    setEmail(c.email ?? ""); setPhone(c.phone ?? ""); setVatId(c.company_vatid ?? "");
    setLinkedId(c.id); setShowNameSug(false); setShowPhoneSug(false); setResults([]);
  }
  function clearCustomer() {
    setFirst(""); setLast(""); setStreet(""); setPlz(""); setOrt("");
    setEmail(""); setPhone(""); setVatId(""); setLinkedId(null);
  }

  // ── Live validation ───────────────────────────────────────────────
  const netNorm = useMemo(() => normalizeDecimalInput(net), [net]);
  const v = useMemo(() => {
    const netNum = Number(netNorm || "0");
    const errors: Record<string, string> = {};
    if (!vehicleId) errors.vehicle = "Vehicle is required";
    if (!orderDate) errors.orderDate = "Order date is required";
    if (!first.trim()) errors.first = "First name is required";
    if (!last.trim()) errors.last = "Last name is required";
    if (!pickup.trim()) errors.pickup = "Pickup address is required";
    if (!dropoff.trim()) errors.dropoff = "Destination address is required";
    if (!netNorm || netNum <= 0) errors.net = "Enter a valid net amount (e.g. 39.00)";
    if (term == null) errors.term = "Select a payment term (15 / 30 / 45 days)";
    if (email.trim() && !EMAIL_RE.test(email.trim())) errors.email = "Email format looks invalid";
    return { errors, isValid: Object.keys(errors).length === 0 };
  }, [vehicleId, orderDate, first, last, pickup, dropoff, netNorm, term, email]);

  const err = (key: string) => (showErrors ? v.errors[key] : undefined);

  function buildPayload(): ParcelOrderInput | null {
    if (!v.isValid) {
      setShowErrors(true);
      const firstErr = Object.values(v.errors)[0];
      pushToast("error", "Please fix the highlighted fields", firstErr);
      return null;
    }
    return {
      ...(linkedId
        ? { customer_id: linkedId }
        : { customer: { first_name: first, last_name: last, street, plz, ort, email: email || null, phone: phone || null, company_vatid: vatId || null, is_business: !!vatId } }),
      // Vehicle is primary; driver is secondary. The driver field autocompletes from the active
      // drivers — when the typed name matches a real driver we link driver_id (so the order is
      // attributable to that driver); otherwise it stays a free-text name.
      vehicle_id: vehicleId,
      driver_id: driverId,
      driver_name: driverName.trim() || null,
      client_reference: clientRef.trim() || null,
      service_type: serviceType || null,
      preferred_date: preferredDate || null,
      pickup_address: pickup, pickup_city: null,
      destination_address: dropoff, destination_city: null,
      distance_km: routeKm ? normalizeDecimalInput(routeKm) : null,
      total_km: kmGes ? normalizeDecimalInput(kmGes) : null,
      occupied_km: kmBes ? normalizeDecimalInput(kmBes) : null,
      scheduled_datetime: orderDate ? `${orderDate}T00:00:00` : null,
      net_amount: netNorm!,
      vat_rate: vat,
      payment_due_days: term ?? 14,
      service_description: serviceDescription || null,
      parcel_quantity: 1,
    };
  }

  async function ensureSaved(): Promise<CourierOrder | null> {
    const payload = buildPayload();
    if (!payload) return null;
    const saved = order ? await updateParcelOrder(order.id, payload) : await createParcelOrder(payload);
    setOrder(saved);
    if (!linkedId && saved.customer_id) setLinkedId(saved.customer_id);
    // Create-or-reuse the invoice (backend is idempotent) so the order is immediately billable.
    if (!hasInvoice) {
      await createOrderInvoice(saved.id, {});
      setHasInvoice(true);
    }
    return saved;
  }

  function wrap(key: string, fn: () => Promise<void>) {
    setBusy(key);
    fn().catch((e) => pushToast("error", "Failed", e instanceof ApiError ? e.message : "Network error")).finally(() => setBusy(null));
  }

  const onSave = () => wrap("save", async () => { if (await ensureSaved()) pushToast("success", "Saved"); });
  const onPdf = () => wrap("pdf", async () => { const o = await ensureSaved(); if (o) window.open(`/api/v0/admin/orders/${o.id}/slip/pdf`, "_blank"); });

  // ── Dispatch actions ──
  // WhatsApp: opens WhatsApp (Web on laptop, the app on mobile) with the driver's number and a
  // prefilled job briefing — the operator reviews and hits send. Backend moves draft→dispatched.
  const onWhatsApp = () => wrap("wa", async () => {
    const o = await ensureSaved();
    if (!o) return;
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
  const onEmailDriver = () => wrap("mailDrv", async () => {
    const o = await ensureSaved();
    if (!o) return;
    setOrder(await sendDocuments(o.id, ["driver"]));
    pushToast("success", "Slip emailed to driver");
  });
  // Email the invoice (PDF) to the client.
  const onEmailInvoice = () => wrap("mailCust", async () => {
    const o = await ensureSaved();
    if (!o) return;
    setOrder(await sendDocuments(o.id, ["customer"]));
    pushToast("success", "Invoice emailed to client");
  });

  // ── derived ──
  const vehicle = vehicles.find((veh) => veh.id === vehicleId) || null;
  const fullName = `${first} ${last}`.trim();
  const netNum = Number(netNorm || "0");
  const rate = Number(vat) || 0;
  const vatAmt = netNum * rate;
  const brutto = netNum + vatAmt;
  const vatPct = Math.round(rate * 100);
  const leerKm = Math.max(0, (parseInt(kmGes) || 0) - (parseInt(kmBes) || 0));
  const money = (n: number) => formatPriceEur((Number.isFinite(n) ? n : 0).toFixed(2));

  // ── Action-bar gating ──
  const saved = order != null;
  const canSave = v.isValid && !busy;
  const canPdf = saved && !busy;
  // Dispatch gating: WhatsApp/email-to-driver need an assigned driver; email-invoice needs a
  // customer email. All require the order to be saved first.
  const canWhatsApp = saved && !!driverId && !busy;
  const canEmailDriver = saved && !!driverId && !busy;
  const canEmailInvoice = saved && !!email.trim() && !busy;
  const saveTitle = canSave ? "Save the order" : v.isValid ? "Working…" : "Complete the required fields first";
  const pdfTitle = canPdf ? "Open the driver-slip PDF" : "Save the order first to generate its PDF";
  const waTitle = canWhatsApp ? "Open WhatsApp to the driver with a prefilled job briefing" : !saved ? "Save the order first" : "Assign a driver (with a phone number) first";
  const emailDrvTitle = canEmailDriver ? "Email the driver-slip PDF to the driver" : !saved ? "Save the order first" : "Assign a driver (with an email) first";
  const emailCustTitle = canEmailInvoice ? "Email the invoice PDF to the client" : !saved ? "Save the order first" : "Add a customer email first";

  const barHint = (() => {
    if (busy) return null;
    if (!v.isValid && showErrors) return Object.values(v.errors)[0];
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
          <span className="text-[12.5px] font-medium text-slate-900">{c.first_name} {c.last_name}</span>
          <span className="text-[11px] text-slate-500">
            {[c.phone, [c.plz, c.ort].filter(Boolean).join(" "), c.company_vatid].filter(Boolean).join(" · ")}
          </span>
        </button>
      ))}
    </div>
  );

  const FieldErr = ({ msg }: { msg?: string }) =>
    msg ? <p role="alert" className="mt-1 flex items-center gap-1 text-[11px] text-rose-600"><AlertCircle className="h-3 w-3" />{msg}</p> : null;

  const req = <span className="text-rose-500">*</span>;

  return (
    <>
      <AdminPageHeader
        title="New Order"
        description="Create a transport order — vehicle-centric, with logbook and billing details."
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
        {/* Status strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border border-slate-200 bg-white px-4 py-3">
          {order ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700">
              <Check className="h-3 w-3" strokeWidth={3} /> Saved · <span className="font-mono text-slate-700">{order.order_number}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-1 text-[11px] font-medium text-slate-400">
              Not saved yet — order number assigned on save
            </span>
          )}
        </div>

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
                  <DatePicker variant="admin" locale="en" value={orderDate} onChange={setOrderDate} invalid={!!err("orderDate")} aria-label="Order date" />
                  <FieldErr msg={err("orderDate")} />
                </AdminFormField>
                <AdminFormField label={<span className="flex items-center gap-1.5"><CalendarClock className="h-3 w-3 text-slate-400" /> Desired date</span>}>
                  <DatePicker variant="admin" locale="en" value={preferredDate} onChange={setPreferredDate} aria-label="Desired date" />
                </AdminFormField>
                <AdminFormField label={<span className="flex items-center gap-1.5"><Truck className="h-3 w-3 text-slate-900" /> Vehicle {req}</span>}>
                  <select
                    className={cn(adminInputClass, err("vehicle") && "border-rose-400 focus:border-rose-500")}
                    aria-invalid={!!err("vehicle") || undefined}
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                  >
                    <option value="">– Select vehicle –</option>
                    {vehicles.map((veh) => <option key={veh.id} value={veh.id}>{vehicleLabel(veh)}</option>)}
                  </select>
                  <FieldErr msg={err("vehicle")} />
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
                        value={dForm.full_name}
                        onChange={(e) => setDForm((f) => ({ ...f, full_name: e.target.value }))}
                        placeholder="Full name *"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className={adminInputClass}
                          value={dForm.phone}
                          onChange={(e) => setDForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="Phone"
                        />
                        <input
                          className={adminInputClass}
                          value={dForm.email}
                          onChange={(e) => setDForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="Email"
                        />
                      </div>
                      <input
                        className={adminInputClass}
                        value={dForm.vehicle_label}
                        onChange={(e) => setDForm((f) => ({ ...f, vehicle_label: e.target.value }))}
                        placeholder="Vehicle label (e.g. SN 1122)"
                      />
                      <label className="flex items-center gap-1.5 text-[12px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={dForm.active}
                          onChange={(e) => setDForm((f) => ({ ...f, active: e.target.checked }))}
                        />
                        Active
                      </label>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={saveDriver}
                          disabled={driverSaving || !dForm.full_name.trim()}
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
              description="Search a saved customer by name or phone, or add a new one."
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
                  <AdminFormField label={<span>First name {req}</span>}>
                    <input
                      className={cn(adminInputClass, err("first") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("first") || undefined}
                      value={first}
                      placeholder="Type to search or add new…"
                      onChange={(e) => { setFirst(e.target.value); setLinkedId(null); setShowNameSug(true); runSearch(`${e.target.value} ${last}`.trim()); }}
                      onFocus={() => setShowNameSug(true)}
                      onBlur={() => setTimeout(() => setShowNameSug(false), 180)}
                    />
                    <FieldErr msg={err("first")} />
                  </AdminFormField>
                  <AdminFormField label={<span>Last name {req}</span>}>
                    <input
                      className={cn(adminInputClass, err("last") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("last") || undefined}
                      value={last}
                      placeholder="Last"
                      onChange={(e) => { setLast(e.target.value); setLinkedId(null); setShowNameSug(true); runSearch(`${first} ${e.target.value}`.trim()); }}
                      onFocus={() => setShowNameSug(true)}
                      onBlur={() => setTimeout(() => setShowNameSug(false), 180)}
                    />
                    <FieldErr msg={err("last")} />
                  </AdminFormField>
                  {showNameSug && results.length > 0 && sugList}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative">
                    <AdminFormField label={<span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> Phone</span>}>
                      <input
                        className={adminInputClass}
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setLinkedId(null); setShowPhoneSug(true); runSearch(e.target.value); }}
                        onFocus={() => setShowPhoneSug(true)}
                        onBlur={() => setTimeout(() => setShowPhoneSug(false), 180)}
                        placeholder="+49 …"
                      />
                    </AdminFormField>
                    {showPhoneSug && results.length > 0 && sugList}
                  </div>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Hash className="h-3 w-3 text-slate-400" /> Client ref. no.</span>}>
                    <input className={adminInputClass} value={clientRef} onChange={(e) => setClientRef(e.target.value)} placeholder="e.g. 000358066" />
                  </AdminFormField>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> Email</span>}>
                    <input
                      className={cn(adminInputClass, err("email") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("email") || undefined}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@company.de"
                    />
                    <FieldErr msg={err("email")} />
                  </AdminFormField>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <AdminFormField label="Street"><input className={adminInputClass} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street & no." /></AdminFormField>
                  <AdminFormField label="Postcode"><input className={adminInputClass} value={plz} onChange={(e) => setPlz(e.target.value)} placeholder="73207" /></AdminFormField>
                  <AdminFormField label="City"><input className={adminInputClass} value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="Plochingen" /></AdminFormField>
                  <AdminFormField label="VAT ID"><input className={adminInputClass} value={vatId} onChange={(e) => setVatId(e.target.value)} placeholder="DE… (B2B)" /></AdminFormField>
                </div>
              </div>
            </AdminCard>

            {/* Section 3 — Route */}
            <AdminCard title={<span className="flex items-center gap-2"><RouteIcon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Route</span>}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <AdminFormField label={<span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-emerald-600" /> Pickup address {req}</span>}>
                    <input
                      className={cn(adminInputClass, err("pickup") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("pickup") || undefined}
                      value={pickup} onChange={(e) => setPickup(e.target.value)}
                      placeholder="Street, postcode city"
                    />
                    <FieldErr msg={err("pickup")} />
                  </AdminFormField>
                </div>
                <AdminFormField label={<span className="flex items-center gap-1.5"><Gauge className="h-3 w-3 text-slate-400" /> KM (pickup→dest.)</span>}>
                  <AffixInput unit="km" type="number" min={0} step={1} value={routeKm} onChange={(e) => setRouteKm(e.target.value)} placeholder="0" />
                </AdminFormField>
                <div className="sm:col-span-2">
                  <AdminFormField label={<span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-rose-600" /> Destination address {req}</span>}>
                    <input
                      className={cn(adminInputClass, err("dropoff") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("dropoff") || undefined}
                      value={dropoff} onChange={(e) => setDropoff(e.target.value)}
                      placeholder="Street, postcode city"
                    />
                    <FieldErr msg={err("dropoff")} />
                  </AdminFormField>
                </div>
                <AdminFormField label={<span className="flex items-center gap-1.5"><Tag className="h-3 w-3 text-slate-400" /> Service type</span>}>
                  <select className={adminInputClass} value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType | "")}>
                    <option value="">– Select –</option>
                    {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </AdminFormField>
              </div>
            </AdminCard>

            {/* Section 4 — Pricing */}
            <AdminCard
              title={<span className="flex items-center gap-2"><Receipt className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Pricing</span>}
              description="Price shows on the invoice only — never on the driver order."
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AdminFormField label={<span>Net amount (€) {req}</span>}>
                    <AffixInput unit="EUR" type="number" value={net} invalid={!!err("net")} onChange={(e) => setNet(e.target.value)} placeholder="0.00" />
                    <FieldErr msg={err("net")} />
                  </AdminFormField>
                  <AdminFormField label="VAT">
                    <select className={adminInputClass} value={vat} onChange={(e) => setVat(e.target.value)}>
                      {VAT_PRESETS.map((val) => <option key={val} value={val}>{Math.round(Number(val) * 100)}%</option>)}
                    </select>
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
              </div>
            </AdminCard>

            {/* Section 5 — Logbook */}
            <AdminCard
              title={<span className="flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Logbook</span>}
              description="Total km driven / occupied km (§ 4 Abs. 7 EStG). Empty km is derived."
            >
              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
                <AdminFormField label="Total km driven">
                  <AffixInput unit="km" type="number" min={0} step={1} value={kmGes} onChange={(e) => setKmGes(e.target.value)} placeholder="0" />
                </AdminFormField>
                <AdminFormField label="Occupied km">
                  <AffixInput unit="km" type="number" min={0} step={1} value={kmBes} onChange={(e) => setKmBes(e.target.value)} placeholder="0" />
                </AdminFormField>
                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Empty km</span>
                  <span className="font-mono text-[14px] font-semibold tabular-nums text-slate-900">{leerKm} km</span>
                </div>
              </div>
            </AdminCard>

            {/* Section 6 — Payment term + description */}
            <AdminCard title={<span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Payment term &amp; description</span>}>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[12px] font-medium text-slate-700">Payment term {req} <span className="font-normal text-slate-400">(§ 271 BGB)</span></p>
                  <div className="grid grid-cols-3 gap-2">
                    {TERM_CHIPS.map((c) => (
                      <button
                        key={c.days}
                        type="button"
                        onClick={() => setTerm(c.days)}
                        className={cn(
                          "flex flex-col items-center border-[1.5px] px-2 py-2.5 text-xs font-bold transition-colors",
                          term === c.days
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
                        )}
                      >
                        {c.label}
                        <span className="mt-0.5 text-[9.5px] font-normal opacity-65">{c.sub}</span>
                      </button>
                    ))}
                  </div>
                  {term != null && orderDate ? (
                    <p className="mt-2 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      Due on: {addDaysDE(orderDate, term)} ({term} days net)
                    </p>
                  ) : (
                    showErrors && err("term") && <FieldErr msg={err("term")} />
                  )}
                </div>

                <AdminFormField label="Service description (§ 14 UStG)">
                  <textarea
                    className={cn(adminInputClass, "h-auto py-2")}
                    rows={3}
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Detailed description of the service…"
                  />
                </AdminFormField>
              </div>
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
                        {previewMode === "driver" ? "Fahrauftrag" : "Rechnung"}
                      </p>
                      <p className="font-mono text-[12.5px] text-slate-700">{order?.order_number ?? "—"}</p>
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
                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border border-slate-200 bg-slate-50 p-3.5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Abholung</p>
                          <p className="mt-1 text-[13px] font-medium leading-snug text-slate-900">{pickup || <span className="italic text-slate-400">—</span>}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-600">Ziel</p>
                          <p className="mt-1 text-[13px] font-medium leading-snug text-slate-900">{dropoff || <span className="italic text-slate-400">—</span>}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 border border-dashed border-slate-300 px-3.5 py-2.5 text-[12px] text-slate-500">
                        <span>Auftraggeber: <strong className="text-slate-900">{fullName || "—"}</strong></span>
                        <span>Termin: <strong className="text-slate-900">{preferredDate ? deDate(preferredDate) : deDate(orderDate)}</strong></span>
                        <span>Strecke: <strong className="text-slate-900">{routeKm ? `${routeKm} km` : "—"}</strong></span>
                      </div>
                      {serviceType && (
                        <p className="mt-3 text-[12px] text-slate-600"><span className="font-semibold text-slate-900">Leistungsart:</span> {serviceType}</p>
                      )}
                      {serviceDescription && (
                        <p className="mt-1 text-[12px] text-slate-600">{serviceDescription}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-x-4 text-[11px] text-slate-500">
                        <span>Gefahrene KM: <strong className="text-slate-700">{kmGes || "—"}</strong></span>
                        <span>Besetzt: <strong className="text-slate-700">{kmBes || "—"}</strong></span>
                        <span>Leer: <strong className="text-slate-700">{leerKm} km</strong></span>
                      </div>
                      <div className="mt-8 grid grid-cols-2 gap-6">
                        <div className="border-t border-slate-900 pt-1.5 text-[11px] font-semibold text-slate-500">Unterschrift Fahrer</div>
                        <div className="border-t border-slate-900 pt-1.5 text-[11px] font-semibold text-slate-500">Unterschrift Auftraggeber</div>
                      </div>
                      <p className="mt-4 text-center text-[11px] italic text-slate-500">Belegart Fahrauftrag — enthält bewusst keine Preisangaben.</p>
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
                                {clientRef && <div className="mt-0.5 text-[11px] text-slate-500">Ref.-Nr.: {clientRef}</div>}
                              </>
                            ) : <span className="italic text-slate-400">Kunde wählen…</span>}
                          </div>
                        </div>
                        <dl className="min-w-[170px] space-y-1 text-[12px]">
                          <div className="flex justify-between gap-6"><dt className="text-slate-500">Leistungsdatum</dt><dd className="text-slate-800">{deDate(preferredDate || orderDate)}</dd></div>
                          <div className="flex justify-between gap-6"><dt className="text-slate-500">Fällig bis</dt><dd className="text-slate-800">{term != null ? addDaysDE(orderDate, term) : "—"}</dd></div>
                        </dl>
                      </div>

                      <table className="mt-5 w-full border-collapse">
                        <thead><tr className="border-b-2 border-slate-900 text-[10px] uppercase tracking-wide text-slate-500">
                          <th className="py-1.5 pr-2 text-left font-semibold">Pos.</th>
                          <th className="py-1.5 pr-2 text-left font-semibold">Bezeichnung</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">Netto</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">MwSt</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">Gesamt</th>
                        </tr></thead>
                        <tbody><tr className="border-b border-slate-100 align-top">
                          <td className="py-2.5 pr-2 text-[13px]">1</td>
                          <td className="py-2.5 pr-2 text-[13px]">
                            <strong className="text-slate-900">{serviceType || "Transportleistung"}</strong>
                            {(pickup || dropoff) && <div className="text-[11px] text-slate-500">{pickup || "—"} → {dropoff || "—"}</div>}
                            {serviceDescription && <div className="text-[11px] text-slate-500">{serviceDescription}</div>}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{money(netNum)}</td>
                          <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{vatPct}%</td>
                          <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{money(netNum)}</td>
                        </tr></tbody>
                      </table>

                      <div className="mt-4 flex justify-end">
                        <div className="w-64 text-[13px]">
                          <div className="flex justify-between py-0.5"><span className="text-slate-500">Zwischensumme (netto)</span><span className="font-mono">{money(netNum)}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-500">zzgl. MwSt {vatPct}%</span><span className="font-mono">{money(vatAmt)}</span></div>
                          <div className="mt-1 flex justify-between border-t-2 border-slate-900 bg-slate-50 px-2 py-2 text-[15px] font-semibold text-slate-900"><span>Gesamtbetrag</span><span className="font-mono">{money(brutto)}</span></div>
                        </div>
                      </div>

                      <p className="mt-5 text-[12px] leading-relaxed text-slate-600">
                        Zahlbar ohne Abzug bis <strong className="text-slate-900">{term != null ? addDaysDE(orderDate, term) : "—"}</strong> ({term ?? 0} Tage netto).
                        Bitte geben Sie bei der Zahlung die Rechnungsnummer <span className="font-mono">{order?.order_number ?? "—"}</span> an.
                      </p>
                      <p className="mt-2 border-t border-dashed border-slate-300 pt-2 text-[11px] text-slate-500">{ISSUER.bank}</p>
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
