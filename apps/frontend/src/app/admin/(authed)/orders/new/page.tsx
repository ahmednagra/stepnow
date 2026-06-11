// app/admin/(authed)/orders/new/page.tsx
// New Parcel Order console. Two-pane builder (customer · parcel/route · driver/price) with a
// live driver-slip / customer-invoice preview, manual delivery lifecycle, and a sticky action
// bar. Built entirely on the admin design system (AdminPageHeader / AdminCard / AdminFormField
// + Tailwind tokens) — no page-local CSS. Wired to the real courier/customer/driver services.
//
// Action-bar UX (progressive enablement):
//   • Save        → enabled once the core required fields are valid (live, pre-click).
//   • Driver PDF  → enabled only after the order is persisted (needs a real order id).
//   • Send driver → enabled only after save + a driver is assigned + invoice exists
//                   (+ a customer email when "cc customer" is on).
// Every disabled control explains *why* via its title, and an inline hint lists what's missing.

"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  User, Mail, Phone, Package, MapPin, ArrowRight, ArrowLeft, Boxes, Scale, CalendarDays,
  UserCheck, Truck, Building2, Receipt, Check, X, Eye, EyeOff, Save, FileDown, Send, Loader2,
  AlertCircle, MessageCircle,
} from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass } from "@/components/admin";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { cn } from "@/utils/cn";
import { normalizeDecimalInput, formatPriceEur } from "@/utils/decimal";
import { searchCustomers, type CustomerAdmin } from "@/services/customers";
import { listAdminDrivers, type DriverAdmin } from "@/services/drivers";
import {
  createParcelOrder, updateParcelOrder, setDeliveryStatus, sendDocuments, slipPdfHref,
  sendDriverSlipWhatsApp,
  type CourierOrder, type DeliveryStatus, type ParcelOrderInput,
} from "@/services/courier";
import { createOrderInvoice } from "@/services/orders";

const VAT_PRESETS = ["0", "0.07", "0.19"];
const TERM_PRESETS = [14, 30, 45];
const FLOW: DeliveryStatus[] = ["draft", "dispatched", "picked_up", "delivered"];
const STEP_LABEL: Record<DeliveryStatus, string> = {
  draft: "Draft", dispatched: "Dispatched", picked_up: "Picked up", delivered: "Delivered",
};
// Display-only issuer block for the live preview. The stored PDFs are rendered server-side
// from SiteSettings — these strings never reach the actual document.
const ISSUER = {
  name: "StepNow Rides & Movers",
  sub: "Naeem Ahmad e.K. · Plochingen/Esslingen",
  sender: "StepNow Rides & Movers — Naeem Ahmad e.K. · Blumenstraße 8 · 73779 Deizisau",
  steuer: "Steuer-Nr. 59500/72609",
  bank: "IBAN DE12 6005 0101 0001 2345 67 · BIC SOLADEST600 · Kreissparkasse Esslingen",
  foot: "StepNow Rides & Movers · Naeem Ahmad e.K. · Blumenstraße 8, 73779 Deizisau · +49 (0) 1590 1225850 · rides@mail.step-now.de",
};

// Loose but practical email check — mirrors what the backend will accept.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const todayISO = () => new Date().toISOString().slice(0, 10);
const deDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const addDaysDE = (iso: string, d: number | string) => {
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

export default function NewParcelOrderPage() {
  const pushToast = useAdminToast((s) => s.push);

  // customer
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [street, setStreet] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vatId, setVatId] = useState("");
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [results, setResults] = useState<CustomerAdmin[]>([]);
  const [showNameSug, setShowNameSug] = useState(false);
  const [showPhoneSug, setShowPhoneSug] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // parcel + route
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [consignee, setConsignee] = useState("");
  const [parcelDesc, setParcelDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [weight, setWeight] = useState("");
  const [pickDate, setPickDate] = useState(todayISO());

  // driver + price
  const [drivers, setDrivers] = useState<DriverAdmin[]>([]);
  const [driverId, setDriverId] = useState("");
  const [net, setNet] = useState("");
  const [vat, setVat] = useState("0.07");
  const [term, setTerm] = useState("14");

  // persisted order + ui
  const [order, setOrder] = useState<CourierOrder | null>(null);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [ccCustomer, setCcCustomer] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<"driver" | "customer">("driver");
  // True after the first Save attempt — used to reveal inline field errors only once
  // the user has tried to act (avoids yelling at an untouched form).
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    listAdminDrivers({ active_only: true, size: 100 }).then((r) => setDrivers(r.items)).catch(() => {});
  }, []);

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
  // Centralised, derived every render. Drives both inline field errors and
  // which action-bar buttons are enabled. Keep the rules here, not scattered.
  const netNorm = useMemo(() => normalizeDecimalInput(net), [net]);
  const v = useMemo(() => {
    const netNum = Number(netNorm || "0");
    const errors: Record<string, string> = {};
    if (!first.trim()) errors.first = "First name is required";
    if (!last.trim()) errors.last = "Last name is required";
    if (!pickup.trim()) errors.pickup = "Pickup address is required";
    if (!dropoff.trim()) errors.dropoff = "Destination address is required";
    if (!netNorm || netNum <= 0) errors.net = "Enter a valid net price (e.g. 39.00)";
    if (email.trim() && !EMAIL_RE.test(email.trim())) errors.email = "Email format looks invalid";
    if (qty && (Number(qty) < 1 || !Number.isFinite(Number(qty)))) errors.qty = "Quantity must be at least 1";
    if (weight && Number(weight) < 0) errors.weight = "Weight cannot be negative";
    const termN = Number(term);
    if (term && (termN < 1 || termN > 120)) errors.term = "Term must be 1–120 days";
    return { errors, isValid: Object.keys(errors).length === 0 };
  }, [first, last, pickup, dropoff, netNorm, email, qty, weight, term]);

  const err = (key: string) => (showErrors ? v.errors[key] : undefined);

  function buildPayload(): ParcelOrderInput | null {
    // Validity is already computed in `v`; surface a single toast pointing at the gap.
    if (!v.isValid) {
      setShowErrors(true);
      const first = Object.values(v.errors)[0];
      pushToast("error", "Please fix the highlighted fields", first);
      return null;
    }
    return {
      ...(linkedId
        ? { customer_id: linkedId }
        : { customer: { first_name: first, last_name: last, street, plz, ort, email: email || null, phone: phone || null, company_vatid: vatId || null, is_business: !!vatId } }),
      driver_id: driverId || null,
      pickup_address: pickup, pickup_city: null,
      destination_address: dropoff, destination_city: null,
      consignee: consignee || null,
      parcel_description: parcelDesc || null,
      parcel_quantity: Number(qty) || 1,
      parcel_weight_kg: weight ? normalizeDecimalInput(weight) : null,
      scheduled_datetime: pickDate ? `${pickDate}T00:00:00` : null,
      net_amount: netNorm!,
      vat_rate: vat,
      payment_due_days: Number(term) || 14,
    };
  }

  async function ensureSaved(): Promise<CourierOrder | null> {
    const payload = buildPayload();
    if (!payload) return null;
    const saved = order ? await updateParcelOrder(order.id, payload) : await createParcelOrder(payload);
    setOrder(saved);
    if (!linkedId && saved.customer_id) setLinkedId(saved.customer_id);
    // Create-or-reuse the invoice (backend is idempotent). This is what enables "Send to driver".
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
  const onPdf = () => wrap("pdf", async () => { const o = await ensureSaved(); if (o) window.open(slipPdfHref(o.id), "_blank"); });
  const onSend = () => wrap("send", async () => {
    const o = await ensureSaved(); if (!o) return;
    const to: Array<"driver" | "customer"> = ["driver", ...(ccCustomer && email ? (["customer"] as const) : [])];
    const updated = await sendDocuments(o.id, to); setOrder(updated);
    pushToast("success", `Driver slip sent${ccCustomer && email ? " · invoice queued to customer" : ""}`);
  });
  const onWhatsApp = () => wrap("whatsapp", async () => {
    const o = await ensureSaved(); if (!o) return;
    const updated = await sendDriverSlipWhatsApp(o.id);
    setOrder(updated);
    if (updated.whatsapp_link) {
      window.open(updated.whatsapp_link, "_blank", "noopener");
      pushToast("success", "WhatsApp opened", "Slip message prefilled — press send in WhatsApp.");
    } else {
      pushToast("error", "Could not build the WhatsApp link");
    }
  });

  const goToStage = (stage: DeliveryStatus) => wrap("stage", async () => {
    if (!order || stage === order.delivery_status) return;
    const updated = await setDeliveryStatus(order.id, stage); setOrder(updated);
    pushToast("success", `Marked ${STEP_LABEL[stage].toLowerCase()}`);
  });

  // derived
  const ds: DeliveryStatus = order?.delivery_status ?? "draft";
  const stepIdx = FLOW.indexOf(ds);
  const driver = drivers.find((d) => d.id === driverId) || null;
  const fullName = `${first} ${last}`.trim();
  const netNum = Number(netNorm || "0");
  const rate = Number(vat) || 0;
  const vatAmt = netNum * rate;
  const brutto = netNum + vatAmt;
  const vatPct = Math.round(rate * 100);
  const money = (n: number) => formatPriceEur((Number.isFinite(n) ? n : 0).toFixed(2));
  const ccNoEmail = ccCustomer && !email;

  // ── Action-bar gating (progressive enablement) ────────────────────
  const saved = order != null;
  const emailValidIfPresent = !email.trim() || EMAIL_RE.test(email.trim());
  const canSave = v.isValid && !busy;
  const canPdf = saved && !busy;
  const sendBlockers: string[] = [];
  if (!saved) sendBlockers.push("save the order");
  if (!driverId) sendBlockers.push("assign a driver");
  if (!hasInvoice) sendBlockers.push("create the invoice (save first)");
  if (ccCustomer && (!email || !emailValidIfPresent)) sendBlockers.push("add a valid customer email or untick “email invoice”");
  const canSend = sendBlockers.length === 0 && !busy;

  const saveTitle = canSave
    ? "Save the order"
    : v.isValid ? "Working…" : "Complete the required fields first";
  const pdfTitle = canPdf ? "Open the driver-slip PDF" : "Save the order first to generate its PDF";
  const sendTitle = canSend ? "Send the driver slip" : `To send: ${sendBlockers.join(", ")}`;

  // WhatsApp web-click handoff: needs a saved order + an assigned driver with a phone number.
  const driverHasPhone = !!driver?.phone;
  const waBlockers: string[] = [];
  if (!saved) waBlockers.push("save the order");
  if (!driverId) waBlockers.push("assign a driver");
  if (!driverHasPhone) waBlockers.push("the driver needs a phone number");
  const canWhatsApp = waBlockers.length === 0 && !busy;
  const waTitle = canWhatsApp
    ? "Open WhatsApp with the driver slip prefilled"
    : `To send via WhatsApp: ${waBlockers.join(", ")}`;

  // What the inline hint should say next to the bar.
  const barHint = (() => {
    if (busy) return null;
    if (!v.isValid && showErrors) return Object.values(v.errors)[0];
    if (!saved) return "Save the order to unlock the PDF and sending.";
    if (!canSend) return `Next: ${sendBlockers.join(", ")}.`;
    return null;
  })();

  const chip = (active: boolean) =>
    cn(
      "flex-1 border px-2 py-1 text-[11px] font-semibold transition-colors",
      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
    );

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

  // Small inline field-error line.
  const FieldErr = ({ msg }: { msg?: string }) =>
    msg ? <p role="alert" className="mt-1 flex items-center gap-1 text-[11px] text-rose-600"><AlertCircle className="h-3 w-3" />{msg}</p> : null;

  return (
    <>
      <AdminPageHeader
        title="New Parcel Order"
        description="Create a courier job, dispatch it to a driver, and bill the customer."
        actions={
          <>
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
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
        {/* Status strip + delivery stepper */}
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
          <ol className="ml-auto flex min-w-[280px] flex-1 items-center gap-2">
            {FLOW.map((s, i) => (
              <Fragment key={s}>
                <li>
                  <button
                    type="button"
                    onClick={() => goToStage(s)}
                    disabled={!order || !!busy}
                    title={order ? `Mark as ${STEP_LABEL[s]}` : "Save the order first"}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full py-0.5 pr-1.5 transition-colors",
                      order && "hover:bg-slate-50",
                      !order && "cursor-not-allowed",
                    )}
                  >
                    <span className={cn(
                      "grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold tabular-nums transition-colors",
                      i < stepIdx ? "bg-emerald-600 text-white"
                        : i === stepIdx ? "bg-slate-900 text-white ring-2 ring-slate-900/15"
                          : "bg-slate-200 text-slate-500",
                    )}>
                      {i < stepIdx ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={cn("text-[11px] font-semibold", i <= stepIdx ? "text-slate-900" : "text-slate-400")}>
                      {STEP_LABEL[s]}
                    </span>
                  </button>
                </li>
                {i < FLOW.length - 1 && <span className={cn("h-px flex-1", i < stepIdx ? "bg-emerald-500" : "bg-slate-200")} />}
              </Fragment>
            ))}
          </ol>
        </div>
        {order && (
          <p className="-mt-2 px-1 text-[11px] text-slate-400">
            Tip: dispatching happens automatically when you send to the driver. Click any step above to mark a stage manually.
          </p>
        )}

        {/* Two-pane: builder + live preview */}
        <div className={cn("grid grid-cols-1 gap-4", previewOpen && "xl:grid-cols-[1.35fr_1fr]")}>
          {/* BUILDER */}
          <div className="space-y-4">
            {/* Customer */}
            <AdminCard
              title={<span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Sender / Customer</span>}
              description="Search a saved customer by name or phone, or type a new one."
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
                  <AdminFormField label="First name" required>
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
                  <AdminFormField label="Last name" required>
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
                  <AdminFormField label="Street"><input className={adminInputClass} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street & no." /></AdminFormField>
                  <AdminFormField label="Postcode"><input className={adminInputClass} value={plz} onChange={(e) => setPlz(e.target.value)} placeholder="73207" /></AdminFormField>
                  <AdminFormField label="City"><input className={adminInputClass} value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="Plochingen" /></AdminFormField>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> Email{ccCustomer && <span className="text-rose-500">*</span>}</span>}>
                    <input
                      className={cn(adminInputClass, err("email") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("email") || undefined}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@company.de"
                    />
                    <FieldErr msg={err("email")} />
                  </AdminFormField>
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
                  <AdminFormField label="VAT ID (USt-IdNr)"><input className={adminInputClass} value={vatId} onChange={(e) => setVatId(e.target.value)} placeholder="DE… (B2B)" /></AdminFormField>
                </div>
              </div>
            </AdminCard>

            {/* Parcel & route */}
            <AdminCard title={<span className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Parcel &amp; Route</span>}>
              <div className="space-y-3">
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
                  <AdminFormField label={<span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-emerald-600" /> Pickup</span>} required>
                    <input
                      className={cn(adminInputClass, err("pickup") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("pickup") || undefined}
                      value={pickup} onChange={(e) => setPickup(e.target.value)}
                      placeholder="Full address — street, postcode, city"
                    />
                    <FieldErr msg={err("pickup")} />
                  </AdminFormField>
                  <ArrowRight className="mb-2.5 hidden h-4 w-4 text-slate-400 sm:block" />
                  <AdminFormField label={<span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-rose-600" /> Destination</span>} required>
                    <input
                      className={cn(adminInputClass, err("dropoff") && "border-rose-400 focus:border-rose-500")}
                      aria-invalid={!!err("dropoff") || undefined}
                      value={dropoff} onChange={(e) => setDropoff(e.target.value)}
                      placeholder="Full address — street, postcode, city"
                    />
                    <FieldErr msg={err("dropoff")} />
                  </AdminFormField>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <AdminFormField label="Recipient at destination"><input className={adminInputClass} value={consignee} onChange={(e) => setConsignee(e.target.value)} placeholder="Consignee name" /></AdminFormField>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Boxes className="h-3 w-3 text-slate-400" /> Quantity</span>}>
                    <AffixInput unit="pcs" type="number" min={1} value={qty} invalid={!!err("qty")} onChange={(e) => setQty(e.target.value)} />
                    <FieldErr msg={err("qty")} />
                  </AdminFormField>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><Scale className="h-3 w-3 text-slate-400" /> Weight</span>}>
                    <AffixInput unit="kg" type="number" min={0} step={0.1} value={weight} invalid={!!err("weight")} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
                    <FieldErr msg={err("weight")} />
                  </AdminFormField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminFormField label="Parcel contents"><input className={adminInputClass} value={parcelDesc} onChange={(e) => setParcelDesc(e.target.value)} placeholder="e.g. documents, medical samples…" /></AdminFormField>
                  <AdminFormField label={<span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-slate-400" /> Pickup date</span>}>
                    <input className={adminInputClass} type="date" value={pickDate} onChange={(e) => setPickDate(e.target.value)} />
                  </AdminFormField>
                </div>
              </div>
            </AdminCard>

            {/* Driver & price */}
            <AdminCard
              title={<span className="flex items-center gap-2"><UserCheck className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} /> Driver assignment &amp; price</span>}
              description="Price shows on the customer invoice only — never on the driver slip."
            >
              <div className="space-y-3">
                <AdminFormField label={<span className="flex items-center gap-1.5"><Truck className="h-3 w-3 text-slate-400" /> Assign driver</span>}>
                  <select className={adminInputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    <option value="">— Select driver —</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}{d.vehicle_label ? ` · ${d.vehicle_label}` : ""}</option>)}
                  </select>
                </AdminFormField>

                {driver && (
                  <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center bg-slate-900 text-[12px] font-semibold uppercase text-white">
                      {driver.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-900">{driver.full_name}</p>
                      {driver.vehicle_label && <p className="flex items-center gap-1 text-[11px] text-slate-500"><Building2 className="h-3 w-3" /> {driver.vehicle_label}</p>}
                    </div>
                    <div className="ml-auto text-right text-[11px] text-slate-500">
                      {driver.phone && <p className="flex items-center justify-end gap-1"><Phone className="h-3 w-3" /> {driver.phone}</p>}
                      {driver.email && <p className="flex items-center justify-end gap-1"><Mail className="h-3 w-3" /> {driver.email}</p>}
                    </div>
                  </div>
                )}

                <div className="grid items-start gap-3 sm:grid-cols-3">
                  <AdminFormField label="Flat price (net)" required>
                    <AffixInput unit="EUR" type="number" value={net} invalid={!!err("net")} onChange={(e) => setNet(e.target.value)} placeholder="0.00" />
                    <FieldErr msg={err("net")} />
                  </AdminFormField>
                  <AdminFormField label="VAT rate">
                    <AffixInput unit="%" type="number" min={0} max={99} value={vatPct} onChange={(e) => setVat(String((Number(e.target.value) || 0) / 100))} placeholder="7" />
                    <div className="mt-1.5 flex gap-1.5">
                      {VAT_PRESETS.map((val) => <button key={val} type="button" className={chip(vat === val)} onClick={() => setVat(val)}>{Math.round(Number(val) * 100)}%</button>)}
                    </div>
                  </AdminFormField>
                  <AdminFormField label="Payment term">
                    <AffixInput unit="days" type="number" min={1} max={120} value={term} invalid={!!err("term")} onChange={(e) => setTerm(e.target.value)} placeholder="14" />
                    <div className="mt-1.5 flex gap-1.5">
                      {TERM_PRESETS.map((d) => <button key={d} type="button" className={chip(Number(term) === d)} onClick={() => setTerm(String(d))}>{d}d</button>)}
                    </div>
                    <FieldErr msg={err("term")} />
                  </AdminFormField>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">Net</p>
                    <p className="mt-0.5 font-mono text-[13px] tabular-nums text-slate-900">{money(netNum)}</p>
                  </div>
                  <div className="border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">VAT {vatPct}%</p>
                    <p className="mt-0.5 font-mono text-[13px] tabular-nums text-slate-900">{money(vatAmt)}</p>
                  </div>
                  <div className="bg-slate-900 px-3 py-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
                    <p className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-white">{money(brutto)}</p>
                  </div>
                </div>
              </div>
            </AdminCard>
          </div>

          {/* LIVE PREVIEW */}
          {previewOpen && (
            <div className="xl:sticky xl:top-4 xl:self-start">
              <AdminCard
                eyebrow="Live preview"
                title={previewMode === "driver" ? "Driver slip" : "Customer invoice"}
                serif
                headerActions={
                  <div className="flex overflow-hidden border border-slate-300">
                    <button type="button" onClick={() => setPreviewMode("driver")} className={cn("flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold", previewMode === "driver" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                      <Truck className="h-3 w-3" /> Slip
                    </button>
                    <button type="button" onClick={() => setPreviewMode("customer")} className={cn("flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold", previewMode === "customer" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                      <Receipt className="h-3 w-3" /> Invoice
                    </button>
                  </div>
                }
              >
                {/* Paper */}
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
                      <p>{previewMode === "driver" ? deDate(pickDate) : `Datum: ${deDate(pickDate)}`}</p>
                      {previewMode === "customer" && <p>{ISSUER.steuer}</p>}
                    </div>
                  </div>

                  {previewMode === "driver" ? (
                    <>
                      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 bg-slate-900 px-3.5 py-2.5 text-white">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300"><Truck className="h-3 w-3" /> Fahrer</span>
                        {driver
                          ? <span className="text-[13px] font-semibold text-white">{driver.full_name}{driver.vehicle_label ? ` · ${driver.vehicle_label}` : ""}{driver.phone ? ` · ${driver.phone}` : ""}</span>
                          : <span className="text-[13px] italic text-slate-400">Noch nicht zugewiesen</span>}
                      </div>
                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border border-slate-200 bg-slate-50 p-3.5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Abholung</p>
                          <p className="mt-1 text-[13px] font-medium leading-snug text-slate-900">{pickup || <span className="italic text-slate-400">—</span>}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-600">Zustellung</p>
                          <p className="mt-1 text-[13px] font-medium leading-snug text-slate-900">{dropoff || <span className="italic text-slate-400">—</span>}</p>
                          {consignee && <p className="text-[11px] text-slate-500">Empfänger: {consignee}</p>}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 border border-dashed border-slate-300 px-3.5 py-2.5 text-[12px] text-slate-500">
                        <span>Auftraggeber: <strong className="text-slate-900">{fullName || "—"}</strong></span>
                        <span>Mobil: <strong className="text-slate-900">{phone || "—"}</strong></span>
                      </div>
                      <table className="mt-4 w-full border-collapse">
                        <thead><tr className="border-b-2 border-slate-900 text-[10px] uppercase tracking-wide text-slate-500">
                          <th className="py-1.5 pr-2 text-left font-semibold">Pos.</th><th className="py-1.5 pr-2 text-left font-semibold">Sendung / Inhalt</th><th className="py-1.5 pl-2 text-right font-semibold">Menge</th><th className="py-1.5 pl-2 text-right font-semibold">Gewicht</th>
                        </tr></thead>
                        <tbody><tr className="border-b border-slate-100 align-top">
                          <td className="py-2.5 pr-2 text-[13px]">1</td>
                          <td className="py-2.5 pr-2 text-[13px]"><strong className="text-slate-900">Kuriersendung</strong>{parcelDesc && <div className="text-[11px] text-slate-500">{parcelDesc}</div>}</td>
                          <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{qty || 1} St.</td>
                          <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{weight ? `${weight} kg` : "—"}</td>
                        </tr></tbody>
                      </table>
                      <div className="mt-8 grid grid-cols-2 gap-6">
                        <div className="border-t border-slate-900 pt-1.5 text-[11px] font-semibold text-slate-500">Unterschrift Abholung</div>
                        <div className="border-t border-slate-900 pt-1.5 text-[11px] font-semibold text-slate-500">Unterschrift Empfänger</div>
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
                              </>
                            ) : <span className="italic text-slate-400">Kunde wählen…</span>}
                          </div>
                        </div>
                        <dl className="min-w-[170px] space-y-1 text-[12px]">
                          <div className="flex justify-between gap-6"><dt className="text-slate-500">Leistungsdatum</dt><dd className="text-slate-800">{deDate(pickDate)}</dd></div>
                          <div className="flex justify-between gap-6"><dt className="text-slate-500">Fällig bis</dt><dd className="text-slate-800">{addDaysDE(pickDate, term)}</dd></div>
                        </dl>
                      </div>

                      <table className="mt-5 w-full border-collapse">
                        <thead><tr className="border-b-2 border-slate-900 text-[10px] uppercase tracking-wide text-slate-500">
                          <th className="py-1.5 pr-2 text-left font-semibold">Pos.</th>
                          <th className="py-1.5 pr-2 text-left font-semibold">Bezeichnung</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">Menge</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">Einzelpreis</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">MwSt</th>
                          <th className="py-1.5 pl-2 text-right font-semibold">Gesamt</th>
                        </tr></thead>
                        <tbody><tr className="border-b border-slate-100 align-top">
                          <td className="py-2.5 pr-2 text-[13px]">1</td>
                          <td className="py-2.5 pr-2 text-[13px]"><strong className="text-slate-900">Kuriertransport (Pauschale)</strong>{(pickup || dropoff) && <div className="text-[11px] text-slate-500">{pickup || "—"} → {dropoff || "—"}</div>}{parcelDesc && <div className="text-[11px] text-slate-500">{parcelDesc}</div>}</td>
                          <td className="py-2.5 pl-2 text-right font-mono text-[12.5px]">{qty || 1}</td>
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
                        Zahlbar ohne Abzug bis <strong className="text-slate-900">{addDaysDE(pickDate, term)}</strong> ({Number(term) || 0} Tage netto).
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
          <label className="flex items-center gap-2 text-[12px] text-slate-600">
            <input type="checkbox" className="accent-emerald-600" checked={ccCustomer} onChange={(e) => setCcCustomer(e.target.checked)} />
            Also email invoice to customer
          </label>
          {ccNoEmail && <span className="bg-rose-50 px-2 py-0.5 text-[10.5px] font-semibold text-rose-700">⚠ no customer email</span>}
          {order?.driver_emailed_at && <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"><Truck className="h-3 w-3" /> Driver notified</span>}
          {barHint && (
            <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:inline-flex">
              <AlertCircle className="h-3 w-3" /> {barHint}
            </span>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {/* Save — enabled only when required fields are valid */}
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              title={saveTitle}
              aria-disabled={!canSave}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
                canSave
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />} {order ? "Update" : "Save"}
            </button>

            {/* Driver slip PDF — enabled only after the order is saved */}
            <button
              type="button"
              onClick={onPdf}
              disabled={!canPdf}
              title={pdfTitle}
              aria-disabled={!canPdf}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
                canPdf
                  ? "border-slate-900 bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} />} Driver slip PDF
            </button>

            {/* Send to WhatsApp — web-click handoff; gated on a saved order + driver with a phone */}
            <button
              type="button"
              onClick={onWhatsApp}
              disabled={!canWhatsApp}
              title={waTitle}
              aria-disabled={!canWhatsApp}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 px-3 text-[12.5px] font-medium transition-colors",
                canWhatsApp
                  ? "bg-[#25D366] text-white hover:bg-[#1FB855]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400",
              )}
            >
              {busy === "whatsapp" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />} Send to WhatsApp
            </button>

            {/* Send to driver — enabled only after save + driver + invoice (+ email when cc'd) */}
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              title={sendTitle}
              aria-disabled={!canSend}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 px-3.5 text-[12.5px] font-medium transition-colors",
                canSend
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-slate-100 text-slate-400",
              )}
            >
              {busy === "send" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" strokeWidth={1.5} />} Send to driver
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
