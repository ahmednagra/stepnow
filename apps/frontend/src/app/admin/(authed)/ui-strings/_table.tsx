// src/app/admin/(authed)/ui-strings/_table.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Lock, Trash2, RotateCcw, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
  AdminFormField,
  ConfirmDialog,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin";
import {
  listAdminUiStrings,
  createAdminUiString,
  updateAdminUiString,
  deleteAdminUiString,
  restoreAdminUiString,
} from "@/services/uiStrings";
import {
  adminUiStringCreateSchema,
  type AdminUiStringCreateInput,
} from "@/schemas/admin-ui-string.schema";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import type { UiStringAdmin } from "@/types";

type ListFilter = "active" | "deleted" | "all";

interface UiStringsTableProps {
  showCreate: boolean;
  onCreateClose: (created: boolean) => void;
}

export function UiStringsTable({ showCreate, onCreateClose }: UiStringsTableProps) {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<UiStringAdmin[] | null>(null);
  const [filter, setFilter] = useState<ListFilter>("active");
  const [namespace, setNamespace] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<UiStringAdmin | null>(null);

  const reload = useCallback(
    async function reload() {
      setLoading(true);
      try {
        const res = await listAdminUiStrings({
          size: 100,
          include_deleted: filter !== "active",
          namespace: namespace || undefined,
          q: q || undefined,
        });
        const filtered =
          filter === "deleted" ? res.items.filter((s) => s.is_deleted) : res.items;
        setItems(filtered);
      } catch (err) {
        pushToast(
          "error",
          "Could not load UI strings",
          err instanceof ApiError ? err.message : "Network error",
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [filter, namespace, q, pushToast],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  // Compute unique namespaces for the filter dropdown
  const namespaces = items
    ? Array.from(new Set(items.map((s) => s.namespace).filter((n): n is string => !!n))).sort()
    : [];

  async function saveCell(
    str: UiStringAdmin,
    field: "value_de" | "value_en",
    newValue: string,
  ) {
    if (newValue === str[field]) return; // no-op
    if (newValue.trim().length === 0) {
      pushToast("error", "Empty value", "Use the delete button if you want to remove this string.");
      // Revert by re-rendering with the original value
      setItems((prev) => (prev ? prev.map((s) => (s.id === str.id ? { ...s } : s)) : prev));
      return;
    }
    try {
      const updated = await updateAdminUiString(str.id, { [field]: newValue });
      setItems((prev) =>
        prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
      );
      pushToast("success", "Saved", `${str.namespace}.${str.key} (${field.slice(-2)})`);
    } catch (err) {
      pushToast(
        "error",
        "Save failed",
        err instanceof ApiError ? err.message : "Network error",
      );
      // Force a re-render so the cell reverts visually
      setItems((prev) => (prev ? [...prev] : prev));
    }
  }

  async function onDelete(str: UiStringAdmin) {
    try {
      await deleteAdminUiString(str.id);
      pushToast("success", "String deleted");
      void reload();
    } catch (err) {
      pushToast(
        "error",
        "Delete failed",
        err instanceof ApiError ? err.message : "Network error",
      );
    }
  }

  async function onRestore(str: UiStringAdmin) {
    try {
      await restoreAdminUiString(str.id);
      pushToast("success", "String restored");
      void reload();
    } catch (err) {
      pushToast(
        "error",
        "Restore failed",
        err instanceof ApiError ? err.message : "Network error",
      );
    }
  }

  return (
    <>
      <AdminCard
        flush
        title={`${items?.length ?? 0} ${items?.length === 1 ? "string" : "strings"}`}
        description="Click a value cell to edit. Save on Enter or blur."
        headerActions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                placeholder="Search key or value…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-8 w-56 border border-slate-300 bg-white pl-7 pr-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <select
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              aria-label="Namespace"
            >
              <option value="">All namespaces</option>
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ListFilter)}
              className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              aria-label="Filter"
            >
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
              <option value="all">All</option>
            </select>
          </div>
        }
      >
        <AdminTable columns={["Key", "Value (DE)", "Value (EN)", "Status", ""]}>
          {loading ? (
            <AdminTableEmpty message="Loading…" />
          ) : !items || items.length === 0 ? (
            <AdminTableEmpty message="No UI strings found." />
          ) : (
            items.map((s) => (
              <AdminTableRow
                key={s.id}
                className={s.is_deleted ? "opacity-60" : ""}
              >
                <AdminTableCell className="align-top">
                  <p className="font-mono text-[11px] font-medium text-slate-900">{s.key}</p>
                  <p className="font-mono text-[10px] text-slate-500">{s.namespace}</p>
                  {s.description && (
                    <p className="mt-1 text-[10px] italic text-slate-400">{s.description}</p>
                  )}
                </AdminTableCell>
                <AdminTableCell className="align-top">
                  <EditableCell
                    value={s.value_de}
                    disabled={s.is_deleted}
                    onSave={(v) => saveCell(s, "value_de", v)}
                  />
                </AdminTableCell>
                <AdminTableCell className="align-top">
                  <EditableCell
                    value={s.value_en}
                    disabled={s.is_deleted}
                    onSave={(v) => saveCell(s, "value_en", v)}
                  />
                </AdminTableCell>
                <AdminTableCell className="align-top">
                  <div className="flex flex-col gap-1">
                    {s.is_locked && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                        <Lock className="h-2.5 w-2.5" />
                        Locked
                      </span>
                    )}
                    {s.is_deleted && (
                      <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        Deleted
                      </span>
                    )}
                  </div>
                </AdminTableCell>
                <AdminTableCell className="align-top text-right">
                  {s.is_deleted ? (
                    <button
                      type="button"
                      onClick={() => void onRestore(s)}
                      className="inline-flex h-6 items-center gap-1 border border-slate-300 bg-white px-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  ) : (
                    !s.is_locked && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(s)}
                        title="Delete"
                        className="inline-flex h-6 items-center px-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )
                  )}
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </AdminTable>
      </AdminCard>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this UI string?"
        body={
          confirmDelete
            ? `${confirmDelete.namespace}.${confirmDelete.key} will be soft-deleted. The public site will fall back to the key name until you restore it.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) {
            const target = confirmDelete;
            setConfirmDelete(null);
            void onDelete(target);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {showCreate && (
        <CreateUiStringModal
          onClose={(created) => {
            onCreateClose(created);
          }}
        />
      )}
    </>
  );
}

interface EditableCellProps {
  value: string;
  disabled?: boolean;
  onSave: (newValue: string) => void;
}

function EditableCell({ value, disabled, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync external value changes back into draft when not editing
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  function commit() {
    if (draft !== value) onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing && !disabled) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Enter (without shift) commits; shift+enter inserts a newline; Esc cancels.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        rows={Math.max(1, Math.min(6, draft.split("\n").length))}
        className="w-full border border-slate-900 bg-white px-1.5 py-1 font-mono text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className="block w-full whitespace-pre-wrap break-words border border-transparent px-1.5 py-1 text-left font-mono text-[12px] text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:bg-transparent"
      title={disabled ? "Restore to edit" : "Click to edit"}
    >
      {value || <span className="italic text-slate-400">(empty)</span>}
    </button>
  );
}

interface CreateUiStringModalProps {
  onClose: (created: boolean) => void;
}

function CreateUiStringModal({ onClose }: CreateUiStringModalProps) {
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminUiStringCreateInput>({
    resolver: zodResolver(adminUiStringCreateSchema),
    defaultValues: {
      key: "",
      namespace: "common",
      value_de: "",
      value_en: "",
      description: "",
      is_locked: false,
    },
  });

  async function onSubmit(values: AdminUiStringCreateInput) {
    setServerError(null);
    try {
      await createAdminUiString({
        key: values.key,
        namespace: values.namespace,
        value_de: values.value_de,
        value_en: values.value_en,
        description: values.description?.trim() || null,
        is_locked: values.is_locked,
      });
      pushToast("success", "String created", `${values.namespace}.${values.key}`);
      onClose(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Create failed", msg);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-ui-string-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={() => onClose(false)}
    >
      <div
        className="w-full max-w-xl border border-slate-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 id="create-ui-string-title" className="text-sm font-semibold text-slate-900">
            New UI string
          </h3>
          <button
            type="button"
            onClick={() => onClose(false)}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          {serverError && (
            <div
              role="alert"
              className="border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
            >
              {serverError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminFormField
              label="Key"
              required
              error={errors.key?.message}
              helper="Lowercase, digits, dots, underscores."
            >
              <input
                placeholder="footer.legal_links.privacy"
                className={`${adminInputClass} font-mono`}
                {...register("key")}
              />
            </AdminFormField>
            <AdminFormField
              label="Namespace"
              required
              error={errors.namespace?.message}
              helper="e.g. common, header, footer, booking"
            >
              <input
                placeholder="common"
                className={`${adminInputClass} font-mono`}
                {...register("namespace")}
              />
            </AdminFormField>
          </div>
          <AdminFormField label="Value (DE)" required error={errors.value_de?.message}>
            <textarea rows={2} className={adminTextareaClass} {...register("value_de")} />
          </AdminFormField>
          <AdminFormField label="Value (EN)" required error={errors.value_en?.message}>
            <textarea rows={2} className={adminTextareaClass} {...register("value_en")} />
          </AdminFormField>
          <AdminFormField label="Description" hint="optional" error={errors.description?.message}>
            <input
              placeholder="Context for translators"
              className={adminInputClass}
              {...register("description")}
            />
          </AdminFormField>
          <AdminFormField label="Locked">
            <label className="flex h-8 items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" className="h-3.5 w-3.5" {...register("is_locked")} />
              Prevent deletion (locked strings remain editable)
            </label>
          </AdminFormField>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-9 items-center bg-slate-900 px-4 text-[13px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create string"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
