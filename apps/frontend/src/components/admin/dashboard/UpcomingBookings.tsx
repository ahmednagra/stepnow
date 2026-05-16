// apps/frontend/src/components/admin/dashboard/UpcomingBookings.tsx
// Compact upcoming-bookings list. Wrapped in memo() so the list doesn't re-render when an unrelated dashboard prop changes.

import { memo } from "react";
import Link from "next/link";
import { PlaneLanding, Building2, School, Briefcase } from "lucide-react";
import { AdminCard } from "../AdminCard";
import { BookingStatusBadge } from "../BookingStatusBadge";
import type { BookingAdmin } from "@/types";

interface Props { items: BookingAdmin[]; }

function fmtDay(iso: string): { day: string; time: string } {
const d = new Date(iso);
const today = new Date();
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const day = sameDay(d, today) ? "Today"
: sameDay(d, tomorrow) ? "Tomorrow"
: d.toLocaleDateString("en-GB", { weekday: "short" });
const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
return { day, time };
}

function pickIcon(b: BookingAdmin) {
const dst = (b.destination_address || "").toLowerCase();
const src = (b.pickup_address || "").toLowerCase();
if (dst.includes("airport") || dst.includes("flughafen") || src.includes("airport")) return PlaneLanding;
if (dst.includes("klinik") || dst.includes("hospital")) return Building2;
if (dst.includes("school") || dst.includes("gymnasium")) return School;
return Briefcase;
}

function UpcomingBookingsBase({ items }: Props) {
return (
<AdminCard
eyebrow="Schedule"
title="Upcoming bookings"
serif
headerActions={
<Link href="/admin/bookings" className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#86683F] hover:text-slate-900">
View all →
</Link>
}
flush
>
{items.length === 0 ? (
<p className="px-5 py-10 text-center text-[13px] text-slate-400">No upcoming bookings.</p>
) : (
<ul className="divide-y divide-slate-100">
{items.map((b) => {
const { day, time } = fmtDay(b.requested_datetime);
const Icon = pickIcon(b);
return (
<li key={b.id}>
<Link href={`/admin/bookings/${b.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50">
<div className="text-center min-w-[52px]">
<p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#A8865A]">{day}</p>
<p className="font-serif text-[20px] font-medium leading-none text-slate-900 tabular-nums">{time}</p>
</div>
<div className="flex-1 min-w-0">
<p className="truncate text-[13.5px] font-medium text-slate-900">{b.customer_name}</p>
<p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-500 truncate">
<Icon className="h-3 w-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
<span className="truncate">
{b.pickup_city ?? b.pickup_address} → {b.destination_city ?? b.destination_address}
</span>
</p>
</div>
<BookingStatusBadge status={b.status} />
</Link>
</li>
);
})}
</ul>
)}
</AdminCard>
);
}

export const UpcomingBookings = memo(UpcomingBookingsBase);
