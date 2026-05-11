// src/app/admin/(authed)/contact-messages/[id]/_detail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2, CheckCircle2, RotateCcw, Mail, Phone, Globe } from "lucide-react";
import {
  AdminCard,
  AdminFormField,
  ConfirmDialog,
  adminTextareaClass,
} from "@/components/admin";
import type { ContactMessageAdmin } from "@/types";
import {
  updateAdminContactMessage,
  deleteAdminContactMessage,
} from "@/services/contact";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";

interface ContactMessageDetailProps {
  initial: ContactMessageAdmin;
}

export function ContactMessageDetail({ initial }: ContactMessageDetailProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [msg, setMsg] = useState<ContactMessageAdmin>(initial);
  const [notes, setNotes] = useState<string>(initial.internal_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isDirty = notes !== (msg.internal_notes ?? "");

  async function patch(payload: { is_handled?: boolean; internal_notes?: string | null }) {
    setBusy(true);
    setServerError(null);
    try {
      const updated = await updateAdminContactMessage(msg.id, payload);
      setMsg(updated);
      setNotes(updated.internal_notes ?? "");
      router.refresh();
      return updated;
    } catch (err) {
      const m = err instanceof ApiError ? err.message : "Network error";
      setServerError(m);
      pushToast("error", "Save failed", m);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onSaveNotes() {
    const updated = await patch({ internal_notes: notes.trim() || null });
    if (updated) pushToast("success", "Notes saved");
  }

  async function onToggleHandled() {
    const next = !msg.is_handled;
    const updated = await patch({ is_handled: next });
    if (updated) {
      pushToast("success", next ? "Marked as handled" : "Marked as unhandled");
    }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteAdminContactMessage(msg.id);
      pushToast("success", "Message deleted");
      router.push("/admin/contact-messages");
      router.refresh();
    } catch (err) {
      pushToast(
        "error",
        "Delete failed",
        err instanceof ApiError ? err.message : "Network error",
      );
      setBusy(false);
    }
  }

  const replySubject = `Re: Your message — ${msg.subject_category}`;
  const replyBody = `\n\n---\n${msg.message}`;
  const mailto = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent(
    replySubject,
  )}&body=${encodeURIComponent(replyBody)}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div className="flex items-center gap-2">
          {msg.is_handled ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Handled
              {msg.handled_at && (
                <span className="ml-1 normal-case tracking-normal opacity-70">
                  on {new Date(msg.handled_at).toLocaleDateString("en-GB")}
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-700">
              Unhandled
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/contact-messages"
            className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Back
          </Link>
          <a
            href={mailto}
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            <Mail className="h-3.5 w-3.5" />
            Reply by email
          </a>
          <button
            type="button"
            onClick={onToggleHandled}
            disabled={busy}
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            {msg.is_handled ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Mark unhandled
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark handled
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="flex h-9 items-center gap-1.5 border border-red-200 bg-white px-3 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: from + message */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AdminCard title="From">
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Name</dt>
                <dd className="text-[13px] text-slate-900">{msg.name}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <Mail className="h-2.5 w-2.5" /> Email
                </dt>
                <dd className="text-[13px] text-slate-900">
                  <a href={`mailto:${msg.email}`} className="hover:underline">
                    {msg.email}
                  </a>
                </dd>
              </div>
              {msg.phone && (
                <div>
                  <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    <Phone className="h-2.5 w-2.5" /> Phone
                  </dt>
                  <dd className="text-[13px] text-slate-900">
                    <a href={`tel:${msg.phone}`} className="hover:underline">
                      {msg.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <Globe className="h-2.5 w-2.5" /> Language
                </dt>
                <dd className="text-[13px] uppercase text-slate-900">{msg.language}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Message">
            <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800">
              {msg.message}
            </div>
          </AdminCard>
        </div>

        {/* Right: notes + metadata */}
        <div className="flex flex-col gap-6">
          <AdminCard
            title="Internal notes"
            description="Visible to admins only."
            headerActions={
              <button
                type="button"
                onClick={onSaveNotes}
                disabled={busy || !isDirty}
                className="flex h-7 items-center gap-1 bg-slate-900 px-2 text-[11px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save notes
              </button>
            }
          >
            <AdminFormField label="Notes">
              <textarea
                rows={8}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={adminTextareaClass}
                disabled={busy}
                placeholder="Reply summary, callbacks scheduled, follow-up notes…"
              />
            </AdminFormField>
          </AdminCard>

          <AdminCard title="Metadata">
            <dl className="flex flex-col gap-2 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-slate-400">Received</dt>
                <dd className="tabular-nums text-slate-700">
                  {new Date(msg.created_at).toLocaleString("en-GB")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Updated</dt>
                <dd className="tabular-nums text-slate-700">
                  {new Date(msg.updated_at).toLocaleString("en-GB")}
                </dd>
              </div>
              {msg.handled_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Handled</dt>
                  <dd className="tabular-nums text-slate-700">
                    {new Date(msg.handled_at).toLocaleString("en-GB")}
                  </dd>
                </div>
              )}
            </dl>
          </AdminCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this message?"
        body="The message will be soft-deleted. Database row remains for compliance."
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmDelete(false);
          void onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
