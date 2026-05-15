// apps/frontend/src/app/admin/(authed)/ui-strings/page.tsx
// UI strings — search by key/value, edit inline, export. Self-contained (replaces the old _table.tsx workflow).

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  FilterToolbar,
} from "@/components/admin";
import { listAdminUiStrings, updateAdminUiString } from "@/services/uiStrings";
import type { UiStringAdmin } from "@/types";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { exportCsv, exportJson } from "@/utils/exporters";

export default function UiStringsPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<UiStringAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { de: string; en: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminUiStrings({ size: 500 });
      setItems(res.items);
      const d: Record<string, { de: string; en: string }> = {};
      for (const s of res.items) d[s.id] = { de: s.value_de, en: s.value_en };
      setDrafts(d);
    } catch (err) {
      pushToast("error", "Could not load UI strings", err instanceof ApiError ? err.message : "Network error");
      setItems([]);
    } finally { setLoading(false); }
  }, [pushToast]);

  useEffect(() => { void reload(); }, [reload]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((s) =>
      s.key.toLowerCase().includes(term) ||
      s.value_de.toLowerCase().includes(term) ||
      s.value_en.toLowerCase().includes(term),
    );
  }, [items, q]);

  async function onSave(s: UiStringAdmin) {
    setSavingId(s.id);
    try {
      const updated = await updateAdminUiString(s.id, {
        value_de: drafts[s.id].de, value_en: drafts[s.id].en,
      });
      setItems((prev) => prev ? prev.map((x) => x.id === s.id ? updated : x) : prev);
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
          title={`${filtered.length} string${filtered.length === 1 ? "" : "s"}`}
          headerActions={
            <FilterToolbar
              searchValue={q}
              onSearchChange={setQ}
              searchPlaceholder="Search key or value…"
              exports={{
                onCsv: () => items && exportCsv(items.map((s) => ({
                  key: s.key, value_de: s.value_de, value_en: s.value_en,
                })), `ui-strings-${new Date().toISOString().slice(0, 10)}.csv`),
                onJson: () => items && exportJson(items, `ui-strings-${Date.now()}.json`),
              }}
            />
          }
        >
          <AdminTable columns={["Key", "DE", "EN", ""]} stickyHeader>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : filtered.length === 0 ? (
              <AdminTableEmpty message="No strings found." />
            ) : (
              filtered.map((s) => {
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
