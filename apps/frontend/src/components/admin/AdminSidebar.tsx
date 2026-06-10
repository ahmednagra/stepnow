// apps/frontend/src/components/admin/AdminSidebar.tsx
// Refined sidebar with gold-rail active state, group dividers, optional badge counts.
// Desktop: fixed rail from `lg` up. Mobile (< lg): slide-in drawer + overlay,
// toggled from the topbar hamburger via the useMobileNav store.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Car,
  MessageSquareQuote,
  HelpCircle,
  Tags,
  Settings,
  CalendarCheck,
  Mail,
  FileText,
  Languages,
  AtSign,
  History,
  Users,
  ClipboardList,
  UserCheck,
  Contact,
  Receipt,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/shared";
import { cn } from "@/utils/cn";
import { useMobileNav } from "@/hooks/useMobileNav";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  group?: string;
  comingSoon?: boolean;
  badgeKey?: "bookings" | "messages";
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/services", label: "Services", icon: Briefcase, group: "Content" },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/pricing", label: "Pricing", icon: Tags },
  { href: "/admin/legal-pages", label: "Legal pages", icon: FileText },
  { href: "/admin/ui-strings", label: "UI strings", icon: Languages },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: CalendarCheck,
    group: "Operations",
    badgeKey: "bookings",
  },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Contact },
  { href: "/admin/drivers", label: "Drivers", icon: UserCheck },
  { href: "/admin/contact-messages", label: "Messages", icon: Mail, badgeKey: "messages" },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt, comingSoon: true },
  { href: "/admin/settings", label: "Business settings", icon: Settings, group: "System" },
  { href: "/admin/admin-users", label: "Admin users", icon: Users, comingSoon: true },
  { href: "/admin/email-logs", label: "Email logs", icon: AtSign, comingSoon: true },
  { href: "/admin/audit-log", label: "Audit log", icon: History },
];

interface AdminSidebarProps {
  counts?: { bookings?: number; messages?: number };
}

/**
 * The actual rail content (brand header + nav + footer). Shared by the desktop
 * rail and the mobile drawer so there is a single source of truth.
 * - `onNavigate` fires when a link is tapped (used to close the drawer).
 * - `onClose` renders a close (✕) button in the header (mobile drawer only).
 */
function SidebarContent({
  counts,
  pathname,
  onNavigate,
  onClose,
}: {
  counts?: { bookings?: number; messages?: number };
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-5">
        <BrandMark size={22} tone="dark" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.20em] text-slate-900">
          StepNow Admin
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-1.5 ml-auto grid h-8 w-8 place-items-center text-slate-500 transition-colors hover:text-slate-900"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </div>
      <nav className="scrollbar-dark flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badge = item.badgeKey ? counts?.[item.badgeKey] : undefined;
          return (
            <div key={item.href}>
              {item.group && (
                <p className="mt-4 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
                  {item.group}
                </p>
              )}
              {item.comingSoon ? (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-[13px] text-slate-400">
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Soon
                  </span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center justify-between gap-2 px-3 py-1.5 text-[13px] transition-colors",
                    isActive
                      ? "bg-[#F5F2EC] font-medium text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-0 top-1 w-[2px] bg-[#A8865A]"
                    />
                  )}
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={cn("h-4 w-4", isActive ? "text-[#A8865A]" : "text-slate-400")}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                  {badge != null && badge > 0 && (
                    <span
                      className={cn(
                        "min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums",
                        isActive ? "bg-[#A8865A] text-white" : "bg-slate-900 text-amber-200",
                      )}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        V0.1 · Phase A
      </div>
    </>
  );
}

function AdminSidebarBase({ counts }: AdminSidebarProps) {
  const pathname = usePathname() ?? "";
  const open = useMobileNav((s) => s.open);
  const setOpen = useMobileNav((s) => s.setOpen);
  const collapsed = useMobileNav((s) => s.collapsed);
  const close = () => setOpen(false);

  // Auto-close the drawer whenever the route changes (e.g. after tapping a link).
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // While the drawer is open: lock body scroll and close on Escape.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <>
       {/* ── Desktop rail — visible from lg up, collapsible ── */}
      <aside
        className={cn(
          "hidden h-full shrink-0 overflow-hidden border-r border-slate-200 bg-white",
          "transition-[width] duration-300 ease-out lg:flex lg:flex-col",
          collapsed ? "lg:w-0 lg:border-r-0" : "lg:w-60",
        )}
      >
        <div className="flex h-full w-60 flex-col">
          <SidebarContent counts={counts} pathname={pathname} />
        </div>
      </aside>

      {/* ── Mobile drawer — below lg only ── */}
      <div className="lg:hidden">
        {/* Backdrop */}
        <div
          onClick={close}
          aria-hidden="true"
          className={cn(
            "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-200",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
        {/* Sliding panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          aria-hidden={!open}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[82vw] flex-col bg-white shadow-xl",
            "transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarContent counts={counts} pathname={pathname} onNavigate={close} onClose={close} />
        </aside>
      </div>
    </>
  );
}

export const AdminSidebar = memo(AdminSidebarBase);
