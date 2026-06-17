// apps/frontend/src/app/admin/(authed)/contact-messages/[id]/_detail.tsx
// Message detail with handled-toggle, internal notes editor, reply mailto, print.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Trash2, Phone, CheckCircle2, Circle, Printer, Reply,
} from "lucide-react";
import {
  AdminCard, AdminFormField, ConfirmDialog, adminTextareaClass,
} from "@/components/admin";
import type { ContactMessageAdmin } from "@/types";
import { useUpdateContactMessage, useDeleteContactMessage } from "@/hooks/mutations/useContactMessageMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { printNode } from "@/utils/exporters";

interface Props { initial: ContactMessageAdmin; }

export function MessageDetail({ initial }: Props) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const updateMessage = useUpdateContactMessage(initial.id);
  const deleteMessage = useDeleteContactMessage();
  const [msg, setMsg] = useState<ContactMessageAdmin>(initial);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(initial.internal_notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDirty = notes !== (msg.internal_notes ?? "");

  async function onToggleHandled() {
    setBusy(true);
    try {
      const updated = await updateMessage.mutateAsync({ id: msg.id, payload: { is_handled: !msg.is_handled } });
      setMsg(updated);
      pushToast("success", updated.is_handled ? "Marked handled" : "Marked unhandled");
      router.refresh();
    } catch (err) {
      pushToast("error", "Update failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  async function onSaveNotes() {
    setBusy(true);
    try {
      const updated = await updateMessage.mutateAsync({ id: msg.id, payload: { internal_notes: notes.trim() || null } });
      setMsg(updated);
      setNotes(updated.internal_notes ?? "");
      pushToast("success", "Notes saved");
      router.refresh();
    } catch (err) {
      pushToast("error", "Save failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteMessage.mutateAsync(msg.id);
      pushToast("success", "Message deleted");
      router.push("/admin/contact-messages");
      router.refresh();
    } catch (err) {
      pushToast("error", "Delete failed", err instanceof ApiError ? err.message : "Network error");
      setBusy(false);
    }
  }

  const mailto = `mailto:${msg.email}?subject=${encodeURIComponent("Re: " + msg.subject_category)}&body=${encodeURIComponent("Hello " + msg.name + ",\n\n")}`;
  const received = new Date(msg.created_at).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4" id="message-printable">
        <AdminCard eyebrow="Message" title={`From ${msg.name}`} serif>
          <dl className="mb-4 grid grid-cols-2 gap-3 text-[12.5px]">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Email</dt>
              <dd className="mt-0.5 text-slate-900"><a href={`mailto:${msg.email}`} className="hover:underline">{msg.email}</a></dd>
            </div>
            {msg.phone && (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Phone</dt>
                <dd className="mt-0.5 text-slate-900"><a href={`tel:${msg.phone}`} className="hover:underline">{msg.phone}</a></dd>
              </div>
            )}
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Category</dt>
              <dd className="mt-0.5">
                <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-700">
                  {msg.subject_category}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Received</dt>
              <dd className="mt-0.5 tabular-nums text-slate-900">{received}</dd>
            </div>
          </dl>
          <div className="border border-slate-200 bg-[#FAFAF7] p-4 text-[13.5px] leading-relaxed text-slate-800 whitespace-pre-wrap">
            {msg.message}
          </div>
        </AdminCard>

        <AdminCard eyebrow="Internal" title="Notes" serif>
          <AdminFormField label="Visible only to admins">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className={adminTextareaClass}
              placeholder="Add a short note for the next admin who reads this…"
            />
          </AdminFormField>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onSaveNotes}
              disabled={busy || !isDirty}
              className="flex h-9 items-center gap-2 bg-slate-900 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save notes
            </button>
          </div>
        </AdminCard>
      </div>

      <aside className="space-y-4">
        <AdminCard eyebrow="Quick actions" title="What's next" serif>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onToggleHandled}
              disabled={busy}
              className={`flex h-9 items-center justify-between border px-3 text-[12.5px] font-medium transition-colors ${
                msg.is_handled
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <span className="flex items-center gap-2">
                {msg.is_handled ? <Circle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {msg.is_handled ? "Reopen" : "Mark as handled"}
              </span>
            </button>
            <a
              href={mailto}
              className="flex h-9 items-center gap-2 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Reply className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Reply via email
            </a>
            {msg.phone && (
              <a
                href={`tel:${msg.phone}`}
                className="flex h-9 items-center gap-2 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                Call {msg.phone}
              </a>
            )}
            <button
              type="button"
              onClick={() => printNode(document.getElementById("message-printable"))}
              className="flex h-9 items-center gap-2 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Print
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-2 flex h-9 items-center gap-2 border border-red-200 bg-white px-3 text-[12.5px] font-medium text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Delete message
            </button>
          </div>
        </AdminCard>

        <AdminCard eyebrow="Audit" title="History" serif>
          <dl className="space-y-2 text-[11.5px]">
            <div className="flex items-baseline justify-between">
              <dt className="text-slate-500">Created</dt>
              <dd className="tabular-nums text-slate-900">{received}</dd>
            </div>
            {msg.handled_at && (
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-500">Handled</dt>
                <dd className="tabular-nums text-slate-900">
                  {new Date(msg.handled_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </dd>
              </div>
            )}
          </dl>
        </AdminCard>
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this message?"
        description="It will be soft-deleted. You can restore it via the audit log if needed."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { setConfirmDelete(false); void onDelete(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
