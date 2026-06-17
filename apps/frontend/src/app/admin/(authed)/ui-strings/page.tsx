// apps/frontend/src/app/admin/(authed)/ui-strings/page.tsx
// UI strings — search by key/value, edit inline, export. Data via useUiStrings (React Query). Self-contained.

"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  FilterToolbar,
} from "@/components/admin";
import { useUiStrings } from "@/hooks/queries/useUiStrings";
import { useUpdateUiString } from "@/hooks/mutations/useUiStringMutations";
import type { UiStringAdmin } from "@/types";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { exportCsv, exportJson } from "@/utils/exporters";

export default function UiStringsPage() {
  const pushToast = useAdminToast((s) => s.push);
  const updateString = useUpdateUiString();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { de: string; en: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  const { data, isLoading } = useUiStrings({ q: debouncedQ || undefined, size: 500 });
  const items = data?.items ?? [];

  useEffect(() => {
    const d: Record<string, { de: string; en: string }> = {};
    for (const s of items) d[s.id] = { de: s.value_de, en: s.value_en };
    setDrafts(d);
  }, [items]);

  async function onSave(s: UiStringAdmin) {
    setSavingId(s.id);
    try {
      await updateString.mutateAsync({
        id: s.id,
        payload: { value_de: drafts[s.id].de, value_en: drafts[s.id].en },
      });
      pushToast("success", "String saved");
    } catch (err) {
      pushToast("error", "Save failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setSavingId(null); }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="UI strings"
        description="Translatable labels used across the public site. Changes are live."
      />
      <div className="p-6">
        <AdminCard
          flush
          title={`${items.length} string${items.length === 1 ? "" : "s"}`}
          headerActions={
            <FilterToolbar
              searchValue={q}
              onSearchChange={setQ}
              searchPlaceholder="Search key or value…"
              exports={{
                onCsv: () => items.length > 0 && exportCsv(items.map((s) => ({
                  key: s.key, value_de: s.value_de, value_en: s.value_en,
                })), `ui-strings-${new Date().toISOString().slice(0, 10)}.csv`),
                onJson: () => items.length > 0 && exportJson(items, `ui-strings-${Date.now()}.json`),
              }}
            />
          }
        >
          <AdminTable columns={["Key", "DE", "EN", ""]} stickyHeader>
            {isLoading ? (
              <AdminTableEmpty message="Loading…" />
            ) : items.length === 0 ? (
              <AdminTableEmpty message="No strings found." />
            ) : (
              items.map((s) => {
                const draft = drafts[s.id] ?? { de: s.value_de, en: s.value_en };
                const dirty = draft.de !== s.value_de || draft.en !== s.value_en;
                return (
                  <AdminTableRow key={s.id}>
                    <AdminTableCell>
                      <p className="font-mono text-[11.5px] text-slate-700">{s.key}</p>
                    </AdminTableCell>
                    <AdminTableCell>
                      <input
                        value={draft.de}
                        onChange={(e) => setDrafts((p) => ({ ...p, [s.id]: { ...(p[s.id] ?? { de: s.value_de, en: s.value_en }), de: e.target.value } }))}
                        className="h-7 w-full border border-slate-200 bg-white px-2 text-[12px] text-slate-900 focus:border-slate-900 focus:outline-none"
                      />
                    </AdminTableCell>
                    <AdminTableCell>
                      <input
                        value={draft.en}
                        onChange={(e) => setDrafts((p) => ({ ...p, [s.id]: { ...(p[s.id] ?? { de: s.value_de, en: s.value_en }), en: e.target.value } }))}
                        className="h-7 w-full border border-slate-200 bg-white px-2 text-[12px] text-slate-900 focus:border-slate-900 focus:outline-none"
                      />
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => onSave(s)}
                        disabled={!dirty || savingId === s.id}
                        className="inline-flex h-7 items-center gap-1.5 bg-slate-900 px-2.5 text-[11.5px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-30"
                      >
                        {savingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </button>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })
            )}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
