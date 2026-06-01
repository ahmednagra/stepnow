// app/admin/(authed)/orders/new/page.tsx
// New Parcel Order console. Client island (mirrors orders/[id]/_detail.tsx state pattern):
// debounced customer search (name/phone), driver assignment, manual delivery lifecycle,
// driver-slip download (no price) + send-to-driver, optional invoice email to customer.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, FileDown, Send, Search, X, ArrowRight, Check } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass } from "@/components/admin";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { normalizeDecimalInput, formatPriceEur } from "@/utils/decimal";
import { searchCustomers, type CustomerAdmin } from "@/services/customers";
import { listAdminDrivers, type DriverAdmin } from "@/services/drivers";
import {
  createParcelOrder, updateParcelOrder, setDeliveryStatus, sendDocuments, slipPdfHref,
  type CourierOrder, type DeliveryStatus, type ParcelOrderInput,
} from "@/services/courier";

const VAT_PRESETS = ["0.07", "0.19", "0"];
const TERM_PRESETS = [14, 30, 45];
const FLOW: DeliveryStatus[] = ["draft", "dispatched", "picked_up", "delivered"];

export default function NewParcelOrderPage() {
  const router = useRouter();
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
  const [showSug, setShowSug] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // parcel + route
  const [pickup, setPickup] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [consignee, setConsignee] = useState("");
  const [parcelDesc, setParcelDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [weight, setWeight] = useState("");

  // driver + price
  const [drivers, setDrivers] = useState<DriverAdmin[]>([]);
  const [driverId, setDriverId] = useState("");
  const [net, setNet] = useState("");
  const [vat, setVat] = useState("0.07");
  const [term, setTerm] = useState("14");

  // persisted order
  const [order, setOrder] = useState<CourierOrder | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ccCustomer, setCcCustomer] = useState(true);

  useEffect(() => { listAdminDrivers({ active_only: true, size: 100 }).then((r) => setDrivers(r.items)).catch(() => {}); }, []);

  const runSearch = useCallback((q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (linkedId || !q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(() => { void searchCustomers(q).then(setResults).catch(() => {}); }, 250);
  }, [linkedId]);

  function pickCustomer(c: CustomerAdmin) {
    setFirst(c.first_name); setLast(c.last_name);
    setStreet(c.street ?? ""); setPlz(c.plz ?? ""); setOrt(c.ort ?? "");
    setEmail(c.email ?? ""); setPhone(c.phone ?? ""); setVatId(c.company_vatid ?? "");
    setLinkedId(c.id); setShowSug(false); setResults([]);
  }
  function clearCustomer() {
    setFirst(""); setLast(""); setStreet(""); setPlz(""); setOrt("");
    setEmail(""); setPhone(""); setVatId(""); setLinkedId(null);
  }

  function buildPayload(): ParcelOrderInput | null {
    const netNorm = normalizeDecimalInput(net);
    if (!netNorm) { pushToast("error", "Enter a valid net price (e.g. 39.00)"); return null; }
    if (!first.trim() || !last.trim()) { pushToast("error", "Customer first and last name are required"); return null; }
    if (!pickup.trim() || !dropoff.trim()) { pushToast("error", "Pickup and destination are required"); return null; }
    return {
      ...(linkedId
        ? { customer_id: linkedId }
        : { customer: { first_name: first, last_name: last, street, plz, ort, email: email || null, phone: phone || null, company_vatid: vatId || null, is_business: !!vatId } }),
      driver_id: driverId || null,
      pickup_address: pickup, pickup_city: pickupCity || null,
      destination_address: dropoff, destination_city: dropoffCity || null,
      consignee: consignee || null,
      parcel_description: parcelDesc || null,
      parcel_quantity: Number(qty) || 1,
      parcel_weight_kg: weight ? normalizeDecimalInput(weight) : null,
      net_amount: netNorm,
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
  const onAdvance = () => wrap("adv", async () => {
    if (!order) return;
    const next = FLOW[Math.min(FLOW.indexOf(order.delivery_status) + 1, FLOW.length - 1)];
    const updated = await setDeliveryStatus(order.id, next); setOrder(updated);
    pushToast("success", `Marked ${next.replace("_", " ")}`);
  });

  const ds = order?.delivery_status ?? "draft";
  const grossPreview = (() => {
    const n = Number(normalizeDecimalInput(net) || "0"); const r = Number(vat || "0");
    return formatPriceEur(String(n + n * r));
  })();

  return (
    <>
      <AdminPageHeader eyebrow="Operations" title="New Parcel Order" description="Create a courier job, dispatch it to a driver, and bill the customer." />
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          {order && <span className="font-mono text-sm text-slate-600">{order.order_number}</span>}
          <DeliveryStatusBadge status={ds} />
          {order && ds !== "delivered" && (
            <button onClick={onAdvance} disabled={!!busy} className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white">
              {ds === "draft" ? "Dispatch" : ds === "dispatched" ? "Mark picked up" : "Mark delivered"} <ArrowRight size={12} />
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Customer */}
          <AdminCard title="Sender / Customer" description="Search a saved customer by name or phone, or type a new one.">
            <div className="relative">
              <AdminFormField label="First name">
                <input className={adminInputClass} value={first} placeholder="Type to search…"
                  onChange={(e) => { setFirst(e.target.value); setLinkedId(null); setShowSug(true); runSearch(`${e.target.value} ${last}`); }}
                  onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 180)} />
              </AdminFormField>
              <AdminFormField label="Last name">
                <input className={adminInputClass} value={last}
                  onChange={(e) => { setLast(e.target.value); setLinkedId(null); setShowSug(true); runSearch(`${first} ${e.target.value}`); }}
                  onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 180)} />
              </AdminFormField>
              {showSug && results.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {results.map((c) => (
                    <button key={c.id} type="button" onMouseDown={() => pickCustomer(c)} className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50">
                      <span className="text-sm font-semibold">{c.first_name} {c.last_name}</span>
                      <span className="text-xs text-slate-500">{c.phone ?? "—"} · {c.plz} {c.ort}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {linkedId && (
              <div className="mb-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                <Check size={12} /> Saved customer
                <button onClick={clearCustomer} className="ml-1"><X size={12} /></button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <AdminFormField label="Street"><input className={adminInputClass} value={street} onChange={(e) => setStreet(e.target.value)} /></AdminFormField>
              <AdminFormField label="Postcode"><input className={adminInputClass} value={plz} onChange={(e) => setPlz(e.target.value)} /></AdminFormField>
              <AdminFormField label="City"><input className={adminInputClass} value={ort} onChange={(e) => setOrt(e.target.value)} /></AdminFormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <AdminFormField label="Email"><input className={adminInputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></AdminFormField>
              <AdminFormField label="Phone"><input className={adminInputClass} value={phone} onChange={(e) => { setPhone(e.target.value); setLinkedId(null); if (e.target.value.replace(/\D/g, "").length >= 3) { setShowSug(true); runSearch(e.target.value); } }} onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 180)} /></AdminFormField>
              <AdminFormField label="VAT ID"><input className={adminInputClass} value={vatId} onChange={(e) => setVatId(e.target.value)} placeholder="DE…" /></AdminFormField>
            </div>
          </AdminCard>

          {/* Parcel & route */}
          <AdminCard title="Parcel & Route">
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="Pickup *"><input className={adminInputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} /></AdminFormField>
              <AdminFormField label="Pickup city"><input className={adminInputClass} value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} /></AdminFormField>
              <AdminFormField label="Destination *"><input className={adminInputClass} value={dropoff} onChange={(e) => setDropoff(e.target.value)} /></AdminFormField>
              <AdminFormField label="Destination city"><input className={adminInputClass} value={dropoffCity} onChange={(e) => setDropoffCity(e.target.value)} /></AdminFormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <AdminFormField label="Recipient"><input className={adminInputClass} value={consignee} onChange={(e) => setConsignee(e.target.value)} /></AdminFormField>
              <AdminFormField label="Quantity"><input className={adminInputClass} type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></AdminFormField>
              <AdminFormField label="Weight (kg)"><input className={adminInputClass} value={weight} onChange={(e) => setWeight(e.target.value)} /></AdminFormField>
            </div>
            <AdminFormField label="Parcel contents"><input className={adminInputClass} value={parcelDesc} onChange={(e) => setParcelDesc(e.target.value)} /></AdminFormField>
          </AdminCard>

          {/* Driver & price */}
          <AdminCard title="Driver & Price" description="Price shows on the customer invoice only — never on the driver slip.">
            <AdminFormField label="Assign driver">
              <select className={adminInputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">— Select driver —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}{d.vehicle_label ? ` · ${d.vehicle_label}` : ""}</option>)}
              </select>
            </AdminFormField>
            <div className="grid grid-cols-3 gap-3">
              <AdminFormField label="Flat price (net) *"><input className={adminInputClass} value={net} onChange={(e) => setNet(e.target.value)} placeholder="0.00" /></AdminFormField>
              <AdminFormField label="VAT rate">
                <select className={adminInputClass} value={vat} onChange={(e) => setVat(e.target.value)}>
                  {VAT_PRESETS.map((v) => <option key={v} value={v}>{(Number(v) * 100).toFixed(0)}%</option>)}
                </select>
              </AdminFormField>
              <AdminFormField label="Payment term (days)">
                <select className={adminInputClass} value={term} onChange={(e) => setTerm(e.target.value)}>
                  {TERM_PRESETS.map((t) => <option key={t} value={t}>{t} days</option>)}
                </select>
              </AdminFormField>
            </div>
            <p className="mt-2 text-sm text-slate-600">Gross total: <strong>{grossPreview}</strong></p>
          </AdminCard>

          {/* Actions */}
          <AdminCard title="Dispatch & Billing">
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={ccCustomer} onChange={(e) => setCcCustomer(e.target.checked)} />
              Also email the invoice to the customer
            </label>
            <div className="flex flex-wrap gap-2">
              <button onClick={onSave} disabled={!!busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
              </button>
              <button onClick={onPdf} disabled={!!busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-900 px-3 py-2 text-sm font-semibold hover:bg-slate-900 hover:text-white">
                {busy === "pdf" ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} Driver slip PDF
              </button>
              <button onClick={onSend} disabled={!!busy || !driverId} title={!driverId ? "Assign a driver first" : ""} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy === "send" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send to driver
              </button>
            </div>
            {order?.driver_emailed_at && <p className="mt-2 text-xs text-emerald-700">Driver notified · {new Date(order.driver_emailed_at).toLocaleString("de-DE")}</p>}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
