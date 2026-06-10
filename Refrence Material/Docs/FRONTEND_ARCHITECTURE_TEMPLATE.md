# Frontend Architecture Template — Next.js 15 + FastAPI BFF

> A reusable, project-agnostic reference for building (or aligning) a frontend that follows this
> architecture. Copy the directory shapes and conventions below into any new project to reproduce
> the same structure. Replace every `{feature}` / `{resource}` placeholder with a real domain name.
>
> The rules are not suggestions. New work mirrors what is already here; it never introduces a
> parallel pattern.

---

## 1. Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI runtime | React 19 |
| Language | TypeScript (strict; `any` banned) |
| Styling | Tailwind CSS |
| Server state | TanStack React Query |
| Realtime | Single WebSocket via a `RealtimeProvider` |
| Backend | FastAPI (server-state source of truth) |

---

## 2. The Data-Flow Contract

Every request travels one path, and only one. The browser **never** reaches the backend directly —
each hop is mandatory.

```
Component  ->  *.client.ts  ->  /api/v0/* route  ->  *.server.ts  ->  Backend (FastAPI)
               clientApi         token extraction    serverApi + ENDPOINTS
```

- **Reads** — Components consume React Query hooks from `src/hooks/queries/`. No raw `fetch`
  in a component. No hard-coded query keys — always go through the key factory.
- **Auth** — The access token is read from `localStorage('accessToken')` on the client and
  forwarded server-side via a single `extractBearerToken` helper.
- **Secrets** — Stay server-side. Only `NEXT_PUBLIC_*` variables cross into the browser bundle.
- **Endpoints** — Never inline a URL. Every endpoint is registered in
  `src/services/api/endpoints.ts` under `ENDPOINTS`.

---

## 3. Directory Structure (the template)

Names in `{braces}` are placeholders. The folder shapes, suffixes, and layering are the part to copy.

```
project-root/
└── src/
    │
    ├── app/                                   # Next.js App Router
    │   ├── api/
    │   │   └── v0/                            # BFF route layer — the ONLY surface the browser hits
    │   │       ├── {resource}/
    │   │       │   └── route.ts               # one route file per resource
    │   │       └── {resource}/
    │   │           ├── route.ts               # list / create / delete on the collection
    │   │           └── {sub-action}/          # nest a NEW segment only when the action is genuinely new
    │   │               └── route.ts           #   e.g. customize / permissions / rename
    │   │
    │   ├── {feature-area}/                     # page routes grouped by product area
    │   │   └── page.tsx
    │   │
    │   ├── (role-or-tenant groups)/            # route groups for auth/tenant branching
    │   │
    │   ├── layout.tsx                          # root layout — provider hierarchy mounts here
    │   ├── loading.tsx                         # streaming skeletons (Suspense boundary)
    │   └── page.tsx
    │
    ├── components/
    │   ├── ui/                                 # shared, app-agnostic primitives (Select, Modal, ...)
    │   ├── auth/                               # auth-related shared components (AccessDenied, ...)
    │   └── {feature}/                          # feature-grouped components, nested by sub-area
    │       └── {sub-feature}/
    │           └── {Component}.tsx
    │
    ├── hooks/
    │   ├── queries/                            # ALL React Query READ hooks
    │   │   ├── index.ts                        # barrel; grouped section exports
    │   │   └── use{Resource}.ts                # one base hook per resource (+ named slices)
    │   └── mutations/                          # ALL React Query WRITE hooks (useMutation + optimistic)
    │       ├── index.ts
    │       └── use{Resource}Mutations.ts
    │
    ├── services/
    │   ├── api/
    │   │   └── endpoints.ts                    # ENDPOINTS — single source for all URLs
    │   └── {resource}/                         # one folder per resource
    │       ├── index.ts                        # re-exports client + server
    │       ├── {resource}.client.ts            # browser -> /api/v0/*  (clientApi)
    │       └── {resource}.server.ts            # route  -> backend     (serverApi + ENDPOINTS)
    │
    ├── types/
    │   ├── {feature}.ts                        # request/response interfaces, exported + annotated
    │   └── {domain}/
    │       └── {sub-type}.ts                   # group related types in a sub-folder when they grow
    │
    ├── lib/
    │   ├── react-query/
    │   │   ├── query-keys.ts                   # queryKeys factory
    │   │   ├── config.ts                       # STALE_TIMES / GC_TIMES tiers
    │   │   └── index.ts                        # exports queryKeys, STALE_TIMES, GC_TIMES
    │   ├── client-api.ts                       # client transport (reads localStorage token, prefixes /api/v0)
    │   ├── server-api.ts                       # server transport (talks to the backend)
    │   ├── auth-utils.ts                       # extractBearerToken
    │   └── {cross-cutting-guard}.ts            # single-choke-point guards (e.g. write guards)
    │
    └── contexts/                               # provider hierarchy, split by concern
        ├── AuthContext.tsx
        ├── ThemeContext.tsx
        ├── RealtimeProvider.tsx                # the ONE WebSocket owner
        ├── SubscriptionContext.tsx
        └── NotificationContext.tsx
```

### Naming conventions baked into the tree

| Pattern | Meaning |
|---------|---------|
| `*.client.ts` | Browser-side service; calls `/api/v0/*` only. |
| `*.server.ts` | Server-side service; calls the backend with `ENDPOINTS` + token. |
| `app/api/v0/{resource}/route.ts` | The BFF boundary — one route file per resource. |
| `use{Resource}.ts` | A React Query read hook (lives in `hooks/queries/`). |
| `use{Resource}Mutations.ts` | A React Query write hook (lives in `hooks/mutations/`). |
| `{Component}.tsx` (PascalCase) | A React component. |
| `index.ts` barrels | Each `services/{resource}/` and each `hooks/` folder re-exports through one. |

---

## 4. Provider Hierarchy

Context is split by concern so unrelated state changes never re-render the tree. A frequent update
in one concern (a quota tick, a notification) must not re-render the whole application.

```
Auth  ->  Theme  ->  Realtime  ->  Subscription  ->  Notification
```

Every provider's `value` is wrapped in `useMemo`; every handler is stabilized with `useCallback`.
Consumers subscribe to the single concern they depend on — nothing more.

---

## 5. Adding a Feature — The Canonical Seven Steps

This is the data-path recipe. Follow it in order; mirror it exactly.

| # | Layer | Location | Responsibility |
|---|-------|----------|----------------|
| 1 | **Types** | `src/types/{feature}.ts` | Request/response interfaces — exported, annotated. |
| 2 | **Endpoint** | `src/services/api/endpoints.ts` | Register the URL under `ENDPOINTS`. Never inline. |
| 3 | **Server service** | `src/services/{resource}/{resource}.server.ts` | `serverApi` + `ENDPOINTS`; accepts `authToken`. |
| 4 | **API route** | `src/app/api/v0/{resource}/route.ts` | Validate input -> extract token -> delegate to server service -> correct status code. |
| 5 | **Client service** | `src/services/{resource}/{resource}.client.ts` | `clientApi`; checks the `localStorage` token; prefixes `/api/v0`. |
| 6 | **Index** | `src/services/{resource}/index.ts` | Re-export client + server. |
| 7 | **Read hook** | `src/hooks/queries/use{Resource}.ts` | Build the hook, then export it from `hooks/queries/index.ts`. |

**Status code map**

| Code | Meaning |
|------|---------|
| `200` | Success — GET / PATCH / PUT |
| `201` | Created — POST |
| `400` | Validation error |
| `401` | Unauthorized |
| `404` | Not found |
| `500` | Server error |

---

## 6. React Query — The Read Path

These rules are load-bearing: the cache is patched live by realtime events, so a sloppy
subscription re-renders on unrelated updates.

- **Key factory only.** `queryKeys.{resource}.{slice}()` — never an inline array literal.
- **Freshness tiers.** Static and reference data (statuses, platforms, countries, lookups) is
  fetched once and reused everywhere:

  ```ts
  staleTime: STALE_TIMES.STATIC,   // long-lived reference data
  gcTime:    GC_TIMES.LONG,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  ```

- **`select` slice at the hook layer, by default.** Components subscribe to the exact slice they
  need, never the whole cached object. Selectors must be referentially stable — defined at module
  scope or memoized with `useCallback`. Never inline a non-trivial transform into `select`.
  Rely on structural sharing rather than wrapping results in new references.
- **One base hook per resource**, plus a small set of named specialized slices. No hook-per-field
  sprawl.
- **One key, one source of truth.** Never fetch the same endpoint from two places. Lift the hook to
  the nearest common parent, or let both children call it — the cached second call is free.
  Gate dependent queries with `enabled` instead of firing-then-discarding.
- **Mutations** use `useMutation` with an optimistic update, then `invalidateQueries` on the
  affected keys.

**Canonical read-hook shape:**

```ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES, GC_TIMES } from '@/lib/react-query';
import { get{Resource} } from '@/services/{resource}/{resource}.client';

export function use{Resource}(param?: string, options = {}) {
  return useQuery({
    queryKey: queryKeys.{resource}.list(param),
    queryFn: () => get{Resource}(param),
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
```

---

## 7. Realtime — Exactly One Connection

- There is **one WebSocket per session**, owned by `RealtimeProvider`. Never open an ad-hoc socket.
- Subscribe to channels — formatted `{scope}:{id}` — through `useRealtime()`.
- `subscribe()` returns an unsubscribe function. **Always** call it in the effect cleanup.
  One `useEffect` per channel, cleaned up on unmount or when the id changes.
- Realtime events patch the cache via `queryClient.setQueryData`, or `invalidateQueries` the
  affected keys. They never trigger polling loops or manual refetch intervals.

---

## 8. Permissions / Access Control

Four-layer defense: render-gate -> component gate -> handler pre-flight -> **backend authoritative gate**.

- **The backend gate is the only real security.** Client guards and `can('resource','action')`
  checks are UX locks, not security.
- On the backend, gate endpoints with a single permission dependency
  (`Depends(has_permission("resource:action"))`). Stacking dependencies creates **AND** logic — use
  one semantically correct permission, not a combination. Avoid role-name gates (`has_role`);
  gate on permissions.
- Keep one source of truth for the permission dictionary, and a seeder that is **merge/add-only,
  never deletes** — so changes apply on cold start and re-login refreshes the cached permission set.

---

## 9. The Governance Gate — How Changes Are Made

These process rules are as binding as the structure itself.

1. **Concept briefing before code.** No implementation begins until the codebase has been inspected
   and a plan is agreed.
2. **Extend, don't create.** Existing files are extended. A new file is created only when strictly
   necessary — for example, a genuinely new route segment.
3. **Exact FIND/REPLACE anchors.** Every edit is delivered as exact anchor blocks matched against
   the verbatim current file — never approximate. Full rewrites only when explicitly requested.
4. **Single choke-point over scattered gates.** Broad cross-cutting behavior (e.g. write-blocking)
   goes through one interceptor in the shared request method, not dozens of component gates.
5. **Diagnose root cause before fixing.** No generic suggestions — find the actual cause first.
6. **Mirror the neighbor.** When two valid approaches exist, choose the one already used in the repo.

---

## 10. Pre-PR Checklist

- [ ] Data flows component -> client -> `/api/v0` route -> server -> backend (no shortcuts).
- [ ] No raw `fetch` in a component; reads go through a `hooks/queries/` hook.
- [ ] Query key comes from the factory; freshness tier matches the data's volatility.
- [ ] Hook exposes a stable, module-scope `select` slice (unless a documented single-consumer exception applies).
- [ ] New URL added to `ENDPOINTS`, not inlined.
- [ ] Mutations are optimistic and invalidate the right keys.
- [ ] Every subscribe/timer/listener/fetch effect returns a cleanup; in-flight fetches abort on unmount.
- [ ] A backend permission gate exists — the client gate is not relied on for security.
- [ ] Edit delivered as exact FIND/REPLACE anchors; existing files extended, not duplicated.
