// apps/frontend/src/components/admin/CommandPalette.tsx
// ⌘K global navigator. Static admin routes + on-demand fuzzy search of bookings/messages.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Briefcase, Calendar, Car, CheckSquare, FileText, HelpCircle,
  LayoutDashboard, Mail, MessageSquareQuote, Search, Settings, Tags, Languages, History,
} from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { listAdminBookings } from "@/services/bookings";
import { listAdminContactMessages } from "@/services/contact";
import { cn } from "@/utils/cn";

interface Item {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: typeof LayoutDashboard;
  group: string;
}

const ROUTES: Item[] = [
  { id: "r-dash", label: "Dashboard", href: "/admin", icon: LayoutDashboard, group: "Navigate" },
  { id: "r-bk", label: "Bookings", href: "/admin/bookings", icon: Calendar, group: "Navigate" },
  { id: "r-msg", label: "Contact messages", href: "/admin/contact-messages", icon: Mail, group: "Navigate" },
  { id: "r-svc", label: "Services", href: "/admin/services", icon: Briefcase, group: "Navigate" },
  { id: "r-veh", label: "Vehicles", href: "/admin/vehicles", icon: Car, group: "Navigate" },
  { id: "r-tst", label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote, group: "Navigate" },
  { id: "r-faq", label: "FAQs", href: "/admin/faqs", icon: HelpCircle, group: "Navigate" },
  { id: "r-pr", label: "Pricing", href: "/admin/pricing", icon: Tags, group: "Navigate" },
  { id: "r-lp", label: "Legal pages", href: "/admin/legal-pages", icon: FileText, group: "Navigate" },
  { id: "r-ui", label: "UI strings", href: "/admin/ui-strings", icon: Languages, group: "Navigate" },
  { id: "r-set", label: "Business settings", href: "/admin/settings", icon: Settings, group: "Navigate" },
  { id: "r-aud", label: "Audit log", href: "/admin/audit-log", icon: History, group: "Navigate" },
  { id: "q-new-svc", label: "New service", href: "/admin/services/new", icon: Briefcase, group: "Quick actions" },
  { id: "q-new-veh", label: "New vehicle", href: "/admin/vehicles/new", icon: Car, group: "Quick actions" },
  { id: "q-new-tst", label: "New testimonial", href: "/admin/testimonials/new", icon: MessageSquareQuote, group: "Quick actions" },
  { id: "q-new-faq", label: "New FAQ", href: "/admin/faqs/new", icon: HelpCircle, group: "Quick actions" },
];

export function CommandPalette() {
  const router = useRouter();
  const open = useCommandPalette((s) => s.open);
  const setOpen = useCommandPalette((s) => s.setOpen);
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmd = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmd) { e.preventDefault(); setOpen(!open); }
      else if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQ(""); setRemote([]); setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setRemote([]); return; }
    const t = setTimeout(async () => {
      try {
        const [bk, msg] = await Promise.all([
          listAdminBookings({ q, size: 5 }),
          listAdminContactMessages({ q, size: 5 }),
        ]);
        const bkItems: Item[] = bk.items.map((b) => ({
          id: `bk-${b.id}`,
          label: `${b.reference} · ${b.customer_name}`,
          hint: b.customer_email,
          href: `/admin/bookings/${b.id}`,
          icon: Calendar,
          group: "Bookings",
        }));
        const msgItems: Item[] = msg.items.map((m) => ({
          id: `msg-${m.id}`,
          label: m.name,
          hint: m.email,
          href: `/admin/contact-messages/${m.id}`,
          icon: Mail,
          group: "Messages",
        }));
        setRemote([...bkItems, ...msgItems]);
      } catch { /* ignore */ }
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const routes = term ? ROUTES.filter((r) =>
      r.label.toLowerCase().includes(term) || r.group.toLowerCase().includes(term)
    ) : ROUTES;
    return [...routes, ...remote];
  }, [q, remote]);

  const groups = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of filtered) {
      if (!m.has(it.group)) m.set(it.group, []);
      m.get(it.group)!.push(it);
    }
    return Array.from(m.entries());
  }, [filtered]);

  useEffect(() => { setActive(0); }, [q, remote.length]);

  function pick(it: Item) {
    setOpen(false);
    router.push(it.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && filtered[active]) { e.preventDefault(); pick(filtered[active]); }
  }

  if (!open) return null;
  let idx = -1;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 px-4 pt-[10vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl border border-slate-200 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to or search bookings, messages…"
            className="flex-1 bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded-sm border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">esc</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-slate-400">No results.</p>
          ) : (
            groups.map(([groupName, items]) => (
              <div key={groupName} className="py-1">
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{groupName}</p>
                {items.map((it) => {
                  idx += 1;
                  const isActive = idx === active;
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => pick(it)}
                      onMouseEnter={() => setActive(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left text-[13px]",
                        isActive ? "bg-[#F5F2EC] text-slate-900" : "text-slate-700",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-[#A8865A]" : "text-slate-400")} strokeWidth={1.5} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      {it.hint && <span className="truncate text-[11px] text-slate-400">{it.hint}</span>}
                      <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[10.5px] text-slate-500">
          <span className="flex items-center gap-2">
            <kbd className="rounded-sm bg-white px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate
            <kbd className="rounded-sm bg-white px-1 py-0.5 font-mono text-[10px]">↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <CheckSquare className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
