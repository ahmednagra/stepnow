// apps/frontend/src/app/(public)/auftrag-erstellen/page.tsx
// No-login worker order form. A shared staff code gates the form; the worker records the job
// (vehicle, route with N pickups/drops, customer, net price). Billing stays admin-only. The
// staff code + create are validated server-side (FastAPI), with light client validation here.

"use client";

import { useState } from "react";
import { Loader2, Plus, X, Check, Truck } from "lucide-react";
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import { ApiError } from "@/lib/api-errors";
import { normalizeDecimalInput } from "@/utils/decimal";
import type { ParcelOrderInput, OrderStopInput, ServiceType } from "@/services/courier";

interface FleetVehicle { id: string; label: string }
type Stop = { company: string; address: string; plz: string; ort: string; time_from: string; time_to: string };

const emptyStop = (): Stop => ({ company: "", address: "", plz: "", ort: "", time_from: "", time_to: "" });
const input = "h-9 w-full border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none";
const SERVICE_TYPES: ServiceType[] = ["Personenbeförderung", "Kuriertransport", "Umzugstransport", "Sonderfahrt"];

export default function PublicCreateOrderPage() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [pickups, setPickups] = useState<Stop[]>([emptyStop()]);
  const [drops, setDrops] = useState<Stop[]>([emptyStop()]);
  const [net, setNet] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneNo, setDoneNo] = useState<string | null>(null);

  async function unlock() {
    setGateBusy(true); setGateError(null);
    try {
      const res = await nextjsApiClient.post<{ ok: boolean }>(ENDPOINTS.PUBLIC.STAFF_GATE, { code: code.trim() });
      if (!res.ok) { setGateError("Wrong code."); return; }
      const fleet = await nextjsApiClient.get<FleetVehicle[]>(ENDPOINTS.PUBLIC.FLEET_VEHICLES);
      setVehicles(fleet);
      setUnlocked(true);
    } catch (e) {
      setGateError(e instanceof ApiError ? e.message : "Could not verify the code.");
    } finally { setGateBusy(false); }
  }

  function toStop(s: Stop, type: "pickup" | "drop"): OrderStopInput {
    const orNull = (v: string) => (v.trim() ? v.trim() : null);
    return {
      stop_type: type, company: orNull(s.company), address: s.address.trim(),
      postcode: orNull(s.plz), city: orNull(s.ort), time_from: orNull(s.time_from), time_to: orNull(s.time_to),
    };
  }

  const valid =
    !!vehicleId && !!company.trim() && !!net.trim() &&
    pickups.every((p) => p.address.trim()) && drops.every((d) => d.address.trim());

  async function submit() {
    if (!valid) { setError("Fill in vehicle, customer, addresses and price."); return; }
    setBusy(true); setError(null);
    try {
      const payload: ParcelOrderInput & { staff_access_code: string } = {
        staff_access_code: code.trim(),
        vehicle_id: vehicleId,
        driver_name: driverName.trim() || null,
        client_reference: clientRef.trim() || null,
        service_type: serviceType || null,
        customer: { company_name: company.trim(), phone: phone.trim() || null, is_business: true },
        stops: [...pickups.map((p) => toStop(p, "pickup")), ...drops.map((d) => toStop(d, "drop"))],
        net_amount: normalizeDecimalInput(net)!,
        service_description: notes.trim() || null,
      };
      const res = await nextjsApiClient.post<{ order_number: string }>(ENDPOINTS.PUBLIC.ORDERS, payload);
      setDoneNo(res.order_number);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create the order.");
    } finally { setBusy(false); }
  }

  if (doneNo) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-6 w-6" /></div>
        <h1 className="font-serif text-2xl text-slate-900">Auftrag erstellt</h1>
        <p className="mt-2 text-slate-600">Auftrags-Nr.: <span className="font-mono font-semibold">A-{doneNo}</span></p>
        <button type="button" onClick={() => { setDoneNo(null); setCompany(""); setPhone(""); setClientRef(""); setServiceType(""); setPickups([emptyStop()]); setDrops([emptyStop()]); setNet(""); setNotes(""); setDriverName(""); setVehicleId(""); }}
          className="mt-6 h-10 bg-slate-900 px-5 text-[13px] font-medium text-white hover:bg-slate-800">Weiteren Auftrag erstellen</button>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm p-8">
        <h1 className="font-serif text-2xl text-slate-900">Auftrag erstellen</h1>
        <p className="mt-1 text-[13px] text-slate-500">Bitte den Mitarbeiter-Code eingeben.</p>
        <input className={`${input} mt-4`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" onKeyDown={(e) => e.key === "Enter" && unlock()} />
        {gateError && <p className="mt-2 text-[12px] text-rose-600">{gateError}</p>}
        <button type="button" onClick={unlock} disabled={gateBusy || !code.trim()}
          className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 bg-slate-900 px-5 text-[13px] font-medium text-white hover:bg-slate-800 disabled:opacity-40">
          {gateBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Weiter
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <h1 className="flex items-center gap-2 font-serif text-2xl text-slate-900"><Truck className="h-5 w-5 text-slate-400" /> Auftrag erstellen</h1>

      <section className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-[12px] text-slate-600">Fahrzeug *
            <select className={`${input} mt-1`} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">– wählen –</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
          <label className="text-[12px] text-slate-600">Fahrer<input className={`${input} mt-1`} value={driverName} onChange={(e) => setDriverName(e.target.value)} /></label>
          <label className="text-[12px] text-slate-600">Auftraggeber (Firma) *<input className={`${input} mt-1`} value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          <label className="text-[12px] text-slate-600">Telefon<input className={`${input} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="text-[12px] text-slate-600">Lade-Referenz<input className={`${input} mt-1`} value={clientRef} onChange={(e) => setClientRef(e.target.value)} /></label>
          <label className="text-[12px] text-slate-600">Leistungsart
            <select className={`${input} mt-1`} value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType | "")}>
              <option value="">– wählen –</option>
              {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
      </section>

      {([["Beladeort", pickups, setPickups], ["Entladeort", drops, setDrops]] as const).map(([title, list, setList]) => (
        <section key={title} className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
          {list.map((s, i) => (
            <div key={i} className="space-y-2 border border-slate-200 bg-slate-50/40 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{title} {list.length > 1 ? i + 1 : ""}</span>
                <button type="button" disabled={list.length === 1} onClick={() => setList(list.filter((_, idx) => idx !== i))}
                  className="inline-flex h-7 w-7 items-center justify-center border border-slate-300 bg-white text-slate-500 disabled:opacity-40"><X className="h-3.5 w-3.5" /></button>
              </div>
              <input className={input} placeholder="Firma (optional)" value={s.company} onChange={(e) => setList(list.map((x, idx) => idx === i ? { ...x, company: e.target.value } : x))} />
              <input className={input} placeholder="Straße & Nr. *" value={s.address} onChange={(e) => setList(list.map((x, idx) => idx === i ? { ...x, address: e.target.value } : x))} />
              <div className="grid grid-cols-2 gap-2">
                <input className={input} placeholder="PLZ" value={s.plz} onChange={(e) => setList(list.map((x, idx) => idx === i ? { ...x, plz: e.target.value } : x))} />
                <input className={input} placeholder="Ort" value={s.ort} onChange={(e) => setList(list.map((x, idx) => idx === i ? { ...x, ort: e.target.value } : x))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500">von <input type="time" className={input} value={s.time_from} onChange={(e) => setList(list.map((x, idx) => idx === i ? { ...x, time_from: e.target.value } : x))} /></label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500">bis <input type="time" className={input} value={s.time_to} onChange={(e) => setList(list.map((x, idx) => idx === i ? { ...x, time_to: e.target.value } : x))} /></label>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setList([...list, emptyStop()])}
            className="inline-flex items-center gap-1.5 border border-dashed border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
            <Plus className="h-3.5 w-3.5" /> {title} hinzufügen
          </button>
        </section>
      ))}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-[12px] text-slate-600">Preis netto (€) *<input type="number" min={0} step="0.01" className={`${input} mt-1`} value={net} onChange={(e) => setNet(e.target.value)} placeholder="0.00" /></label>
        <label className="text-[12px] text-slate-600 sm:col-span-2">Hinweise<textarea rows={2} className={`${input} mt-1 h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      </section>

      {error && <p className="text-[12px] text-rose-600">{error}</p>}
      <button type="button" onClick={submit} disabled={busy || !valid}
        className="flex h-11 w-full items-center justify-center gap-1.5 bg-slate-900 px-5 text-[14px] font-medium text-white hover:bg-slate-800 disabled:opacity-40">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Auftrag erstellen
      </button>
    </div>
  );
}
