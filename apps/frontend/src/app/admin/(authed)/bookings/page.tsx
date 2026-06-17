// apps/frontend/src/app/admin/(authed)/bookings/page.tsx
// Bookings page: kanban (drag) + list view toggle, search, print/csv export.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent, type DragStartEvent, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { LayoutList, Columns, Pencil } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  FilterToolbar,
} from "@/components/admin";
import { BOOKING_STATUSES, type BookingStatus, type BookingAdmin } from "@/types";
import { useBookings } from "@/hooks/queries/useBookings";
import { useUpdateBooking } from "@/hooks/mutations/useBookingMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { cn } from "@/utils/cn";
import { exportCsv, exportJson, printNode } from "@/utils/exporters";

type View = "kanban" | "list";

const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<BookingStatus, { wrap: string; dot: string }> = {
  new: { wrap: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  contacted: { wrap: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  quoted: { wrap: "bg-indigo-50 text-indigo-800 border-indigo-200", dot: "bg-indigo-500" },
  confirmed: { wrap: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  completed: { wrap: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  cancelled: { wrap: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-500" },
};

function StatusPill({ status }: { status: BookingStatus }) {
  const tone = STATUS_TONES[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]",
      tone.wrap,
    )}>
      <span aria-hidden="true" className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function BookingsPage() {
  const pushToast = useAdminToast((s) => s.push);
  const updateBooking = useUpdateBooking();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<View>("kanban");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  const { data, isLoading: loading } = useBookings({ size: 100, q: debouncedQ || undefined });
  const bookings = useMemo(() => (data?.items ?? []).filter((b) => !b.is_deleted), [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byStatus = useMemo(() => {
    const map: Record<BookingStatus, BookingAdmin[]> = {
      new: [], contacted: [], quoted: [], confirmed: [], completed: [], cancelled: [],
    };
    const sorted = [...bookings].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    for (const b of sorted) map[b.status]?.push(b);
    return map;
  }, [bookings]);

  const activeBooking = activeId ? bookings.find((b) => b.id === activeId) ?? null : null;

  async function moveBooking(id: string, toStatus: BookingStatus) {
    const b = bookings.find((x) => x.id === id);
    if (!b || b.status === toStatus) return;
    try {
      await updateBooking.mutateAsync({ id, payload: { status: toStatus } });
      pushToast("success", "Status updated", `${b.reference} → ${STATUS_LABELS[toStatus]}`);
    } catch (err) {
      pushToast("error", "Status change failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const to = String(e.over.id) as BookingStatus;
    if (!(BOOKING_STATUSES as readonly string[]).includes(to)) return;
    void moveBooking(id, to);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Bookings"
        description={view === "kanban" ? "Drag a booking card between columns to change its status." : "List view — sort and export."}
        actions={
          <div className="flex border border-slate-200">
            <button
              type="button"
              onClick={() => setView("kanban")}
              aria-pressed={view === "kanban"}
              className={cn("flex h-9 items-center gap-1.5 px-3 text-[12.5px] font-medium",
                view === "kanban" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
            >
              <Columns className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn("flex h-9 items-center gap-1.5 px-3 text-[12.5px] font-medium",
                view === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
            >
              <LayoutList className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              List
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <FilterToolbar
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search ref, name, email, address…"
          exports={{
            onCsv: () => bookings && exportCsv(bookings.map((b) => ({
              reference: b.reference, customer_name: b.customer_name, customer_email: b.customer_email,
              customer_phone: b.customer_phone, requested_datetime: b.requested_datetime,
              pickup: b.pickup_address, destination: b.destination_address,
              passengers: b.passenger_count, status: b.status,
              quoted_price_eur: b.quoted_price_eur ?? "", created_at: b.created_at,
            })), `bookings-${new Date().toISOString().slice(0, 10)}.csv`),
            onJson: () => bookings && exportJson(bookings, `bookings-${Date.now()}.json`),
            onPrint: () => printNode(document.getElementById("bookings-printable")),
          }}
        />

        <div id="bookings-printable">
          {view === "kanban" ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {BOOKING_STATUSES.map((s) => (
                  <KanbanColumn key={s} status={s} bookings={byStatus[s]} loading={loading} />
                ))}
              </div>
              <DragOverlay>
                {activeBooking ? <KanbanCard booking={activeBooking} dragging /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <AdminCard flush title={`${bookings?.length ?? 0} bookings`}>
              <AdminTable columns={["Reference", "Customer", "When", "Route", "Status", "Price", ""]}>
                {loading ? (
                  <AdminTableEmpty message="Loading…" />
                ) : !bookings || bookings.length === 0 ? (
                  <AdminTableEmpty message="No bookings." />
                ) : (
                  bookings.map((b) => (
                    <AdminTableRow key={b.id}>
                      <AdminTableCell>
                        <Link href={`/admin/bookings/${b.id}`} className="font-mono text-[11.5px] font-medium text-slate-900 hover:underline">
                          {b.reference}
                        </Link>
                      </AdminTableCell>
                      <AdminTableCell>
                        <p className="text-[13px] text-slate-900">{b.customer_name}</p>
                        <p className="text-[11px] text-slate-500">{b.customer_email}</p>
                      </AdminTableCell>
                      <AdminTableCell>
                        <time className="text-[11.5px] tabular-nums text-slate-700" dateTime={b.requested_datetime}>
                          {new Date(b.requested_datetime).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </time>
                      </AdminTableCell>
                      <AdminTableCell>
                        <p className="text-[11.5px] text-slate-600 line-clamp-1 max-w-xs">
                          {b.pickup_city ?? b.pickup_address} → {b.destination_city ?? b.destination_address}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell><StatusPill status={b.status} /></AdminTableCell>
                      <AdminTableCell>
                        <span className="font-serif text-[14px] tabular-nums text-slate-900">
                          {b.quoted_price_eur ? `€${Number(b.quoted_price_eur).toFixed(2)}` : <span className="text-slate-300">—</span>}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell className="text-right">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          aria-label="Open"
                          className="grid h-7 w-7 place-items-center border border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        </Link>
                      </AdminTableCell>
                    </AdminTableRow>
                  ))
                )}
              </AdminTable>
            </AdminCard>
          )}
        </div>
      </div>
    </>
  );
}

function KanbanColumn({ status, bookings, loading }: { status: BookingStatus; bookings: BookingAdmin[]; loading: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const tone = STATUS_TONES[status];
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col border border-slate-200 bg-white transition-colors",
        isOver && "border-[#A8865A] bg-[#FBF7F0]",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2", tone.dot)} aria-hidden="true" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-700">{STATUS_LABELS[status]}</p>
        </div>
        <span className="text-[11px] tabular-nums text-slate-400">{bookings.length}</span>
      </header>
      <div className="flex min-h-[120px] flex-col gap-2 p-2">
        {loading ? (
          <div className="h-16 animate-pulse bg-slate-100" />
        ) : bookings.length === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-slate-400">Empty</p>
        ) : (
          bookings.map((b) => <KanbanCard key={b.id} booking={b} />)
        )}
      </div>
    </div>
  );
}

function KanbanCard({ booking, dragging = false }: { booking: BookingAdmin; dragging?: boolean }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: booking.id });
  const when = new Date(booking.requested_datetime).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab border border-slate-200 bg-white p-2.5 text-[12px] shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] hover:border-slate-400",
        (dragging || isDragging) && "rotate-1 cursor-grabbing border-[#A8865A] shadow-[0_8px_24px_-4px_rgba(168,134,90,0.30)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Link href={`/admin/bookings/${booking.id}`} className="font-mono text-[10.5px] font-medium text-slate-900 hover:underline">
          {booking.reference}
        </Link>
        <span className="text-[10px] tabular-nums text-slate-500">{when}</span>
      </div>
      <p className="mt-1 truncate text-[12.5px] font-medium text-slate-900">{booking.customer_name}</p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
        {booking.pickup_city ?? booking.pickup_address} → {booking.destination_city ?? booking.destination_address}
      </p>
    </article>
  );
}
