// src/lib/realtime.ts
// Pure helpers for the admin realtime socket: URL resolution, typed parsing of server frames
// (untrusted JSON → `unknown` + guards), event → React Query key mapping, reconnect backoff.
// The socket lifecycle itself lives in hooks/realtime/AdminRealtimeProvider.tsx.

import type { QueryKey } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { ENDPOINTS } from "@/services/api/endpoints";

/** Backend close code for a missing/expired/rejected token (routes/api/v0/ws.py). */
export const WS_CLOSE_UNAUTHORIZED = 4401;

/** Wire shape from app/WebSocket/manager.py build_event. `data` is event-specific. */
export interface RealtimeEvent {
  id: string;
  type: string;
  channel: string;
  data: Record<string, unknown>;
}

export type RealtimeMessage = { kind: "event"; event: RealtimeEvent } | { kind: "pong" };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Parse one server frame; anything unrecognised returns null and is ignored. */
export function parseRealtimeMessage(raw: unknown): RealtimeMessage | null {
  if (typeof raw !== "string") return null;
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(msg) || typeof msg.type !== "string") return null;
  if (msg.type === "pong") return { kind: "pong" };
  if (typeof msg.id !== "string" || typeof msg.channel !== "string" || !isRecord(msg.data)) return null;
  return { kind: "event", event: { id: msg.id, type: msg.type, channel: msg.channel, data: msg.data } };
}

// Everything an order-domain change can move: lists/details, bills, the per-vehicle ledger, the
// customer/driver histories + rollups, and the dashboard/sidebar aggregates.
const ORDER_DOMAIN_KEYS: readonly QueryKey[] = [
  queryKeys.orders.all,
  queryKeys.invoices.all,
  queryKeys.vehicleLedger.all,
  queryKeys.customers.all,
  queryKeys.drivers.all,
  queryKeys.dashboard.all,
  queryKeys.sidebar.all,
];

/** Every key the socket keeps fresh — invalidated wholesale after a reconnect (missed events). */
export const REALTIME_KEYS: readonly QueryKey[] = [...ORDER_DOMAIN_KEYS, queryKeys.bookings.all, queryKeys.notifications.all];

/**
 * Query keys an event makes stale. Emitters: WebSocket/events/orders.py ("orders.*" on the
 * "admin" + "order:{id}" channels) and Notifications/Channels/DatabaseChannel.py
 * ("notification.created" on "user:{id}", data.category = the notification's domain).
 */
export function keysForEvent(event: RealtimeEvent): readonly QueryKey[] {
  if (event.type === "notification.created") {
    return event.data.category === "orders" ? [queryKeys.notifications.all, ...ORDER_DOMAIN_KEYS] : [queryKeys.notifications.all];
  }
  if (event.type === "orders.order.created") return [...ORDER_DOMAIN_KEYS, queryKeys.bookings.all]; // a booking was converted
  if (event.type.startsWith("orders.")) return ORDER_DOMAIN_KEYS;
  return [];
}

/** Exponential backoff with equal jitter: half fixed, half random — never a hot 0 ms loop. */
export function reconnectDelay(attempt: number, baseMs = 1_000, capMs = 30_000): number {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return ceiling / 2 + Math.random() * (ceiling / 2);
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * Socket origin: NEXT_PUBLIC_WS_URL (e.g. wss://api.step-now.de), else NEXT_PUBLIC_API_URL with
 * http→ws, else ws://<host>:8000 on a local dev host. Returns null when none applies — the admin
 * then runs on polling alone rather than guessing a production host.
 */
export function resolveAdminSocketUrl(token: string): string | null {
  const configured = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws");
  const origin = configured
    ? configured.replace(/\/(api\/v0|ws)\/?$/, "").replace(/\/$/, "")
    : isLocalHost(window.location.hostname) ? `ws://${window.location.hostname}:8000` : null;
  if (!origin) return null;
  return `${origin}${ENDPOINTS.REALTIME.ADMIN_SOCKET}?token=${encodeURIComponent(token)}`;
}
