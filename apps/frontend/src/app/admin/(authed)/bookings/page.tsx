// src/app/admin/(authed)/bookings/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { BOOKING_STATUSES, type BookingStatus, type BookingAdmin } from "@/types";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES } from "@/components/admin/BookingStatusBadge";
import {
  listAdminBookings,
  updateAdminBooking,
} from "@/services/bookings";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { cn } from "@/utils/cn";

export default function BookingsKanbanPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [bookings, setBookings] = useState<BookingAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const reload = useCallback(
    async function reload() {
      setLoading(true);
      try {
        // Fetch enough to cover all active statuses. Kanban is best for moderate
        const res = await listAdminBookings({ size: 100, q: q || undefined });
        setBookings(res.items.filter((b) => !b.is_deleted));
      } catch (err) {
        pushToast(
          "error",
          "Could not load bookings",
          err instanceof ApiError ? err.message : "Network error",
        );
        setBookings([]);
      } finally {
        setLoading(false);
      }
    },
    [q, pushToast],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const byStatus = useMemo(() => {
    const map: Record<BookingStatus, BookingAdmin[]> = {
      new: [],
      contacted: [],
      quoted: [],
      confirmed: [],
      completed: [],
      cancelled: [],
    };
    if (bookings) {
      // Pre-sort each column by created_at desc (newest first).
      const sorted = [...bookings].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      );
      for (const b of sorted) map[b.status]?.push(b);
    }
    return map;
  }, [bookings]);

  const activeBooking = activeId
    ? bookings?.find((b) => b.id === activeId) ?? null
    : null;

  async function moveBooking(bookingId: string, toStatus: BookingStatus) {
    const booking = bookings?.find((b) => b.id === bookingId);
    if (!booking || booking.status === toStatus) return;

    const fromStatus = booking.status;

    // Optimistic update
    setBookings((prev) =>
      prev ? prev.map((b) => (b.id === bookingId ? { ...b, status: toStatus } : b)) : prev,
    );

    try {
      const updated = await updateAdminBooking(bookingId, { status: toStatus });
      setBookings((prev) =>
        prev ? prev.map((b) => (b.id === bookingId ? updated : b)) : prev,
      );
      pushToast(
        "success",
        "Status updated",
        `${booking.reference} → ${BOOKING_STATUS_LABELS[toStatus]}`,
      );
    } catch (err) {
      // Rollback
      setBookings((prev) =>
        prev
          ? prev.map((b) => (b.id === bookingId ? { ...b, status: fromStatus } : b))
          : prev,
      );
      pushToast(
        "error",
        "Status change failed",
        err instanceof ApiError ? err.message : "Network error",
      );
    }
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over) return;
    const bookingId = String(event.active.id);
    const toStatus = String(event.over.id) as BookingStatus;
    if (!BOOKING_STATUSES.includes(toStatus)) return;
    void moveBooking(bookingId, toStatus);
  }

  return (
    <>
      <AdminPageHeader
        title="Bookings"
        description="Drag a booking card between columns to change its status."
        actions={
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              placeholder="Search ref, name, address…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 w-64 border border-slate-300 bg-white pl-7 pr-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        }
      />

      <div className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {BOOKING_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                bookings={byStatus[status]}
                loading={loading}
              />
            ))}
          </div>

          <DragOverlay>
            {activeBooking ? <KanbanCard booking={activeBooking} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

interface KanbanColumnProps {
  status: BookingStatus;
  bookings: BookingAdmin[];
  loading: boolean;
}

function KanbanColumn({ status, bookings, loading }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-fit min-h-[8rem] flex-col gap-2 border bg-slate-50 p-2 transition-colors",
        isOver ? "border-slate-900 bg-slate-100" : "border-slate-200",
      )}
    >
      <header className="flex items-center justify-between px-1.5 py-1">
        <span
          className={cn(
            "inline-block border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            BOOKING_STATUS_TONES[status],
          )}
        >
          {BOOKING_STATUS_LABELS[status]}
        </span>
        <span className="text-[11px] tabular-nums text-slate-500">{bookings.length}</span>
      </header>
      <div className="flex flex-col gap-2">
        {loading ? (
          <p className="px-2 py-4 text-center text-[11px] italic text-slate-400">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] italic text-slate-400">No bookings</p>
        ) : (
          bookings.map((b) => <KanbanCard key={b.id} booking={b} />)
        )}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  booking: BookingAdmin;
  overlay?: boolean;
}

function KanbanCard({ booking, overlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
  });

  const date = new Date(booking.requested_datetime);
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={cn(
        "border border-slate-200 bg-white p-2.5 text-[12px] shadow-sm transition-opacity",
        overlay ? "rotate-1 shadow-lg" : "cursor-grab active:cursor-grabbing",
        isDragging && !overlay && "opacity-30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/bookings/${booking.id}`}
          // Prevent drag while link is interactive
          onPointerDown={(e) => e.stopPropagation()}
          className="font-mono text-[11px] font-medium text-slate-900 hover:underline"
        >
          {booking.reference}
        </Link>
        <time
          dateTime={booking.requested_datetime}
          className="text-[10px] tabular-nums text-slate-500"
          title={booking.requested_datetime}
        >
          {dateStr} · {timeStr}
        </time>
      </div>
      <p className="mt-1.5 truncate text-[12px] font-medium text-slate-900">
        {booking.customer_name}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">
        {booking.pickup_city ?? booking.pickup_address.split(",")[0]} →{" "}
        {booking.destination_city ?? booking.destination_address.split(",")[0]}
      </p>
      <p className="mt-1 text-[10px] tabular-nums text-slate-500">
        {booking.passenger_count}p · {booking.luggage_count}l
        {booking.quoted_price_eur && ` · €${booking.quoted_price_eur}`}
      </p>
    </div>
  );
}
