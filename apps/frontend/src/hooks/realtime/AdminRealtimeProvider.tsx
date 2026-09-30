// src/hooks/realtime/AdminRealtimeProvider.tsx
// The admin console's ONE realtime socket, mounted once in app/admin/(authed)/layout.tsx.
// Browser → FastAPI /ws directly (the documented BFF exception: route handlers can't proxy a
// WebSocket), authenticated with ?token=. Server events never carry state into the cache — each
// one only invalidates the React Query keys it affects (lib/realtime.ts keysForEvent), coalesced
// so a burst refetches once. Polling stays as the fallback: consumers read useRealtimeConnected()
// to relax their refetchInterval only while the socket is up.
//
// Lifecycle: exponential backoff + jitter on drops; app-level ping/pong heartbeat (a half-open
// socket is dropped after one missed pong); close 4401 → one token refresh, then reconnect; any
// reconnect invalidates every realtime-owned key (events were missed); closes on unmount/logout
// and when another tab clears the token.

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth-storage";
import { ensureFreshToken } from "@/lib/nextjs-api";
import {
  REALTIME_KEYS,
  WS_CLOSE_UNAUTHORIZED,
  keysForEvent,
  parseRealtimeMessage,
  reconnectDelay,
  resolveAdminSocketUrl,
} from "@/lib/realtime";

const HEARTBEAT_MS = 25_000; // under nginx's 60s proxy_read_timeout
const INVALIDATE_COALESCE_MS = 300;

const RealtimeContext = createContext(false);

/** True while the admin socket is open — use it to relax polling, never to gate correctness. */
export function useRealtimeConnected(): boolean {
  return useContext(RealtimeContext);
}

export function AdminRealtimeProvider({ children }: { children: ReactNode }) {
  return <RealtimeContext.Provider value={useAdminRealtime()}>{children}</RealtimeContext.Provider>;
}

function useAdminRealtime(): boolean {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let disposed = false;
    let attempt = 0;
    let everOpened = false;
    let authRetried = false;
    let awaitingPong = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let flushTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const pending = new Map<string, QueryKey>();

    const invalidate = (keys: readonly QueryKey[]) => {
      for (const key of keys) pending.set(JSON.stringify(key), key);
      flushTimer ??= setTimeout(() => {
        flushTimer = undefined;
        for (const key of pending.values()) void qc.invalidateQueries({ queryKey: key });
        pending.clear();
      }, INVALIDATE_COALESCE_MS);
    };

    const detach = (socket: WebSocket) => {
      socket.onopen = socket.onmessage = socket.onclose = null;
      clearInterval(heartbeat);
      heartbeat = undefined;
      ws = null;
      setConnected(false);
    };

    const scheduleReconnect = (delay: number) => {
      if (disposed || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        connect();
      }, delay);
    };

    const onClosed = (code: number) => {
      if (disposed) return;
      if (code !== WS_CLOSE_UNAUTHORIZED) return scheduleReconnect(reconnectDelay(attempt++));
      // Rejected token: refresh once. If the refreshed token is also refused, stay on polling —
      // the next API call's 401 path owns the logout.
      if (authRetried) return;
      authRetried = true;
      void ensureFreshToken().then((ok) => ok && scheduleReconnect(0));
    };

    function connect() {
      if (disposed || ws) return;
      const token = getAccessToken();
      const url = token ? resolveAdminSocketUrl(token) : null;
      if (!url) return; // logged out, or no socket host configured → polling only
      const socket = new WebSocket(url);
      ws = socket;
      socket.onopen = () => {
        attempt = 0;
        authRetried = false;
        awaitingPong = false;
        setConnected(true);
        if (everOpened) invalidate(REALTIME_KEYS);
        everOpened = true;
        heartbeat = setInterval(() => {
          if (awaitingPong) {
            // Half-open (sleep, proxy drop): don't wait on a close handshake that won't come.
            detach(socket);
            socket.close();
            onClosed(1006);
            return;
          }
          awaitingPong = true;
          socket.send(JSON.stringify({ action: "ping" }));
        }, HEARTBEAT_MS);
      };
      socket.onmessage = (e: MessageEvent<unknown>) => {
        awaitingPong = false;
        const msg = parseRealtimeMessage(e.data);
        if (msg?.kind === "event") invalidate(keysForEvent(msg.event));
      };
      socket.onclose = (e) => {
        detach(socket);
        onClosed(e.code);
      };
    }

    const reconnectNow = () => {
      if (ws || disposed) return;
      clearTimeout(retryTimer);
      retryTimer = undefined;
      attempt = 0;
      connect();
    };
    // Another tab logged out (token cleared) or in (token set).
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "accessToken" && e.key !== null) return;
      if (getAccessToken()) {
        authRetried = false;
        return reconnectNow();
      }
      clearTimeout(retryTimer);
      retryTimer = undefined;
      if (ws) {
        const socket = ws;
        detach(socket);
        socket.close(1000);
      }
    };

    connect();
    window.addEventListener("online", reconnectNow);
    window.addEventListener("storage", onStorage);
    return () => {
      disposed = true;
      window.removeEventListener("online", reconnectNow);
      window.removeEventListener("storage", onStorage);
      clearTimeout(retryTimer);
      clearTimeout(flushTimer);
      clearInterval(heartbeat);
      if (ws) {
        ws.onopen = ws.onmessage = ws.onclose = null;
        ws.close(1000);
      }
    };
  }, [qc]);

  return connected;
}
